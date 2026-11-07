import express from "express";
import {
    deleteNotification,
    getNotifications,
    getUnreadCount,
    markAllRead,
    markRead,
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/read-all", markAllRead); // /:id se pehle
router.put("/:id/read", markRead);
router.delete("/:id", deleteNotification);

export default router;