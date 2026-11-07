import mongoose from "mongoose";
import Notification from "../models/Notification.js";

export const getNotifications = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 15, 1), 30);

        const filter = { user: req.user._id };
        if (req.query.unread === "1") filter.read = false;

        const [notifications, total, unread] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            Notification.countDocuments(filter),
            Notification.countDocuments({ user: req.user._id, read: false }),
        ]);

        res.status(200).json({
            notifications,
            page,
            pages: Math.ceil(total / limit),
            total,
            unread,
        });
    } catch (error) {
        console.error("Get notifications error:", error.message);
        res.status(500).json({ message: "Could not fetch notifications" });
    }
};

export const getUnreadCount = async (req, res) => {
    try {
        const unread = await Notification.countDocuments({
            user: req.user._id,
            read: false,
        });

        res.status(200).json({ unread });
    } catch (error) {
        console.error("Unread count error:", error.message);
        res.status(500).json({ message: "Could not fetch notifications" });
    }
};

export const markRead = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const result = await Notification.updateOne(
            { _id: req.params.id, user: req.user._id },
            { read: true }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Marked as read" });
    } catch (error) {
        console.error("Mark read error:", error.message);
        res.status(500).json({ message: "Could not update the notification" });
    }
};

export const markAllRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, read: false },
            { read: true }
        );

        res.status(200).json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("Mark all read error:", error.message);
        res.status(500).json({ message: "Could not update notifications" });
    }
};

export const deleteNotification = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const result = await Notification.deleteOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.status(200).json({ message: "Notification deleted" });
    } catch (error) {
        console.error("Delete notification error:", error.message);
        res.status(500).json({ message: "Could not delete the notification" });
    }
};