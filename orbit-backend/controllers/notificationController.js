const mongoose = require("mongoose");
const Notification = require("../models/Notification");

/**
 * GET /api/notifications
 * Returns paginated notifications for the authenticated user
 */
const getNotifications = async (req, res) => {
    try {
        const userId = req.user.userId;
        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 15;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;
        const filter = { recipient: userId };

        if (req.query.isRead !== undefined) {
            filter.isRead = req.query.isRead === "true";
        }

        const [total, unreadCount, notifications] = await Promise.all([
            Notification.countDocuments(filter),
            Notification.countDocuments({ recipient: userId, isRead: false }),
            Notification.find(filter)
                .populate("sender", "name email role")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        res.status(200).json({
            success: true,
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        console.error("getNotifications error:", error);
        res.status(500).json({ message: "Failed to retrieve notifications" });
    }
};

/**
 * GET /api/notifications/unread-count
 * Quick lightweight query for header bell icon badge
 */
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.userId;
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false,
        });

        res.status(200).json({
            success: true,
            count: unreadCount,
            unreadCount,
        });
    } catch (error) {
        console.error("getUnreadCount error:", error);
        res.status(500).json({ message: "Failed to get unread notification count" });
    }
};

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid notification ID" });
        }

        const notification = await Notification.findOne({
            _id: id,
            recipient: userId,
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();
            await notification.save();
        }

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false,
        });

        res.status(200).json({
            success: true,
            notification,
            unreadCount,
        });
    } catch (error) {
        console.error("markAsRead error:", error);
        res.status(500).json({ message: "Failed to mark notification as read" });
    }
};

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications for the current user as read
 */
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.userId;

        await Notification.updateMany(
            { recipient: userId, isRead: false },
            { $set: { isRead: true, readAt: new Date() } }
        );

        res.status(200).json({
            success: true,
            message: "All notifications marked as read",
            unreadCount: 0,
        });
    } catch (error) {
        console.error("markAllAsRead error:", error);
        res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification owned by the authenticated user
 */
const deleteNotification = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid notification ID" });
        }

        const notification = await Notification.findOneAndDelete({
            _id: id,
            recipient: userId,
        });

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false,
        });

        res.status(200).json({
            success: true,
            message: "Notification deleted successfully",
            unreadCount,
        });
    } catch (error) {
        console.error("deleteNotification error:", error);
        res.status(500).json({ message: "Failed to delete notification" });
    }
};

module.exports = {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
