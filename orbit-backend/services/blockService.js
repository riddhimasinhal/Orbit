const Block = require("../models/Block");

/**
 * Checks if a block exists between userA and userB in either direction.
 * @param {string|ObjectId} userA
 * @param {string|ObjectId} userB
 * @returns {Promise<boolean>}
 */
const isBlocked = async (userA, userB) => {
    if (!userA || !userB) return false;
    const block = await Block.findOne({
        $or: [
            { blocker: userA, blocked: userB },
            { blocker: userB, blocked: userA },
        ],
    });
    return !!block;
};

/**
 * Returns all user IDs that have either blocked or been blocked by the given userId.
 * @param {string|ObjectId} userId
 * @returns {Promise<string[]>}
 */
const getBlockedUserIds = async (userId) => {
    if (!userId) return [];
    const blocks = await Block.find({
        $or: [{ blocker: userId }, { blocked: userId }],
    });
    const ids = new Set();
    for (const b of blocks) {
        if (b.blocker.toString() === userId.toString()) {
            ids.add(b.blocked.toString());
        } else {
            ids.add(b.blocker.toString());
        }
    }
    return Array.from(ids);
};

module.exports = {
    isBlocked,
    getBlockedUserIds,
};
