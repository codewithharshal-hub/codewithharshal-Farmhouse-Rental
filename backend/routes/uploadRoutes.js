import express from "express";
import { uploadMiddleware, uploadPhotos } from "../controllers/uploadController.js";
import { protect } from "../middleware/authMiddleware.js";
import { hostOnly } from "../middleware/roleMiddleware.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many uploads. Please try again in a few minutes.",
});

router.post("/", protect, hostOnly, uploadLimiter, uploadMiddleware, uploadPhotos);

export default router;