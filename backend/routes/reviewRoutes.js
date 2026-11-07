import express from "express";
import {
    createReview,
    deleteReview,
    getFarmhouseReviews,
    getMyReviewStatus,
    updateReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const reviewLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Too many review requests. Please try again in a few minutes.",
});

router.get("/farmhouse/:farmhouseId", getFarmhouseReviews);
router.get("/farmhouse/:farmhouseId/mine", protect, getMyReviewStatus);
router.post("/", protect, reviewLimiter, createReview);
router.put("/:id", protect, reviewLimiter, updateReview);
router.delete("/:id", protect, deleteReview);

export default router;