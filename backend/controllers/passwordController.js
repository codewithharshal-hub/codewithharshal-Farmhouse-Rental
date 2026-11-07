import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import PasswordReset from "../models/PasswordReset.js";
import { sendResetEmail } from "../utils/sendEmail.js";

const RESET_MINUTES = 30;
const RESEND_SECONDS = 60;

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// email chahe register ho ya na ho, jawab hamesha yahi
const GENERIC_MESSAGE =
    "If an account exists for that email, we have sent a password reset link. Please check your inbox.";

const INVALID_LINK = "This reset link is invalid or has expired";

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({
                message: "Please enter your email address",
            });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        // admin ka password .env se chalta hai, blocked user ko email nahi
        if (user && user.role !== "admin" && !user.isBlocked) {
            const recent = await PasswordReset.findOne({
                user: user._id,
                createdAt: { $gt: new Date(Date.now() - RESEND_SECONDS * 1000) },
            });

            if (!recent) {
                await PasswordReset.deleteMany({ user: user._id });

                const token = crypto.randomBytes(32).toString("hex");

                await PasswordReset.create({
                    user: user._id,
                    tokenHash: hashToken(token),
                    expiresAt: new Date(Date.now() + RESET_MINUTES * 60 * 1000),
                });

                const base = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
                const link = `${base}/reset-password/${token}`;

                // wait nahi karte, taaki jawab ka time same rahe
                sendResetEmail({
                    to: user.email,
                    name: user.name,
                    link,
                    minutes: RESET_MINUTES,
                }).catch((err) => console.error("Reset email failed:", err.message));
            }
        }

        res.status(200).json({ message: GENERIC_MESSAGE });
    } catch (error) {
        console.error("Forgot password error:", error.message);
        res.status(500).json({
            message: "Could not process your request. Please try again",
        });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
            return res.status(400).json({ message: INVALID_LINK });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        // bcrypt 72 characters ke baad ka password ignore kar deta hai
        if (password.length > 72) {
            return res.status(400).json({
                message: "Password is too long (maximum 72 characters)",
            });
        }

        const record = await PasswordReset.findOne({
            tokenHash: hashToken(token),
            expiresAt: { $gt: new Date() },
        });

        if (!record) {
            return res.status(400).json({ message: INVALID_LINK });
        }

        const user = await User.findById(record.user);

        if (!user || user.role === "admin") {
            await PasswordReset.deleteMany({ user: record.user });
            return res.status(400).json({ message: INVALID_LINK });
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordChangedAt = new Date(); // purane login session band
        await user.save();

        // ab is user ka koi bhi reset link kaam nahi karega
        await PasswordReset.deleteMany({ user: user._id });

        res.status(200).json({
            message: "Your password has been reset. You can now log in.",
        });
    } catch (error) {
        console.error("Reset password error:", error.message);
        res.status(500).json({
            message: "Could not reset your password. Please try again",
        });
    }
};