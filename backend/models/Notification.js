import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "booking_request",
                "booking_confirmed",
                "booking_rejected",
                "booking_cancelled",
                "review",
                "listing_approved",
                "listing_rejected",
                "ticket_reply",
            ],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        message: {
            type: String,
            trim: true,
            maxlength: 300,
            default: "",
        },
        // sirf app ke andar ka raasta (jaise /my-bookings)
        link: {
            type: String,
            trim: true,
            maxlength: 200,
            default: "",
        },
        read: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

// 90 din baad MongoDB khud delete kar deta hai
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;