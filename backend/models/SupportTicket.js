import mongoose from "mongoose";

export const TICKET_CATEGORIES = ["booking", "listing", "account", "technical", "other"];

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: String,
            enum: ["user", "admin"],
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

const supportTicketSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        category: {
            type: String,
            enum: TICKET_CATEGORIES,
            default: "other",
        },
        status: {
            type: String,
            enum: ["open", "answered", "resolved"],
            default: "open",
        },
        messages: {
            type: [messageSchema],
            default: [],
        },
        lastMessageAt: {
            type: Date,
            default: Date.now,
        },
        // admin ne reply kiya aur user ne abhi nahi dekha
        userUnread: {
            type: Boolean,
            default: false,
        },
        // user ne likha aur admin ne abhi nahi dekha
        adminUnread: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

supportTicketSchema.index({ status: 1, lastMessageAt: -1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;