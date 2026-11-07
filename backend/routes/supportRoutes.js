import express from "express";
import {
    createTicket,
    getMyTicket,
    getMyTickets,
    resolveTicket,
    userReply,
} from "../controllers/supportController.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const ticketLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many tickets. Please try again in a few minutes.",
});

const replyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: "Too many messages. Please slow down.",
});

router.use(protect);

router.post("/", ticketLimiter, createTicket);
router.get("/my", getMyTickets); // /:id se pehle
router.get("/:id", getMyTicket);
router.post("/:id/reply", replyLimiter, userReply);
router.put("/:id/resolve", resolveTicket);

export default router;