import express from "express";
import { askAssistant } from "../controllers/assistantController.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const assistantLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "You have asked a lot of questions. Please try again in a few minutes.",
});

router.post("/", assistantLimiter, askAssistant);

export default router;