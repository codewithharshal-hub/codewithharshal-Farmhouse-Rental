import express from "express";
import {
    getContactMessages,
    sendContactMessage,
    updateContactStatus,
} from "../controllers/contactController.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many messages. Please try again in a few minutes.",
});

router.post("/", contactLimiter, sendContactMessage);
router.get("/", protect, adminOnly, getContactMessages);
router.put("/:id/status", protect, adminOnly, updateContactStatus);

export default router;