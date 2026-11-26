const Notification = require("../models/Notification");

/**
 * Creates an in-app notification.
 * Fails safely without throwing unhandled exceptions to avoid breaking caller flows.
 * Does not notify self.
 */
const createNotification = async ({
    recipient,
    sender = null,
    type,
    title,
    message,
    relatedEntity = null,
    relatedEntityType = null,
    link = "",
}) => {
    try {
        if (!recipient || !type || !title || !message) {
            return null;
        }

        // Do not notify a user about their own actions
        if (sender && recipient.toString() === sender.toString()) {
            return null;
        }

        const notification = await Notification.create({
            recipient,
            sender,
            type,
            title,
            message,
            relatedEntity,
            relatedEntityType,
            link,
        });

        return notification;
    } catch (error) {
        console.error("createNotification error:", error.message);
        return null;
    }
};

module.exports = {
    createNotification,
};
