import express from "express";
import {
    becomeHost,
    getMe,
    loginAdmin,
    loginUser,
    registerUser,
} from "../controllers/authController.js";
import {
    forgotPassword,
    resetPassword,
} from "../controllers/passwordController.js";
import { protect } from "../middleware/authMiddleware.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = express.Router();

const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many login attempts. Please try again in a few minutes.",
});

const forgotLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many requests. Please try again in a few minutes.",
});

const resetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many attempts. Please try again in a few minutes.",
});

const hostLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many requests. Please try again in a few minutes.",
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin-login", adminLoginLimiter, loginAdmin);
router.post("/forgot-password", forgotLimiter, forgotPassword);
router.post("/reset-password", resetLimiter, resetPassword);
router.get("/me", protect, getMe);
router.post("/become-host", protect, hostLimiter, becomeHost);

export default router;