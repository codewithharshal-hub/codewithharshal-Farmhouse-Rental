import mongoose from "mongoose";
import SupportTicket, { TICKET_CATEGORIES } from "../models/SupportTicket.js";
import { notify } from "../utils/notify.js";

const MAX_UNRESOLVED = 5;
const MAX_MESSAGES = 100;
const MAX_TEXT = 2000;

const text = (value) => (typeof value === "string" ? value.trim() : "");

// ticket dhundta hai. user ko sirf apna, admin ko koi bhi
const findTicket = async (req, res, { admin = false } = {}) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(404).json({ message: "Ticket not found" });
        return null;
    }

    const filter = { _id: req.params.id };
    if (!admin) filter.user = req.user._id;

    const query = SupportTicket.findOne(filter);
    if (admin) query.populate("user", "name email phone");

    const ticket = await query;

    if (!ticket) {
        res.status(404).json({ message: "Ticket not found" });
        return null;
    }

    return ticket;
};

const readMessage = (value, res) => {
    const message = text(value);

    if (!message) {
        res.status(400).json({ message: "Please type a message" });
        return null;
    }

    if (message.length > MAX_TEXT) {
        res.status(400).json({
            message: `Message is too long. Keep it under ${MAX_TEXT} characters`,
        });
        return null;
    }

    return message;
};

// ---------------- user ----------------

export const createTicket = async (req, res) => {
    try {
        const subject = text(req.body.subject);
        const message = text(req.body.message);
        const category = TICKET_CATEGORIES.includes(req.body.category)
            ? req.body.category
            : "other";

        if (!subject || !message) {
            return res.status(400).json({
                message: "Please add a subject and a message",
            });
        }

        if (subject.length > 120) {
            return res.status(400).json({
                message: "Subject is too long. Keep it under 120 characters",
            });
        }

        if (message.length < 10) {
            return res.status(400).json({
                message: "Please describe the problem a little more (at least 10 characters)",
            });
        }

        if (message.length > MAX_TEXT) {
            return res.status(400).json({
                message: `Message is too long. Keep it under ${MAX_TEXT} characters`,
            });
        }

        const unresolved = await SupportTicket.countDocuments({
            user: req.user._id,
            status: { $ne: "resolved" },
        });

        if (unresolved >= MAX_UNRESOLVED) {
            return res.status(400).json({
                message: `You already have ${MAX_UNRESOLVED} unresolved tickets. Please wait for a reply or mark one as solved`,
            });
        }

        const ticket = await SupportTicket.create({
            user: req.user._id,
            subject,
            category,
            messages: [{ sender: "user", text: message }],
            lastMessageAt: new Date(),
        });

        res.status(201).json({
            message: "Your ticket has been created",
            ticket,
        });
    } catch (error) {
        console.error("Create ticket error:", error.message);
        res.status(500).json({ message: "Could not create your ticket" });
    }
};

export const getMyTickets = async (req, res) => {
    try {
        // list mein sirf aakhri message chahiye
        const tickets = await SupportTicket.find({ user: req.user._id })
            .sort({ lastMessageAt: -1 })
            .limit(100)
            .select({ messages: { $slice: -1 } });

        res.status(200).json(tickets);
    } catch (error) {
        console.error("Get my tickets error:", error.message);
        res.status(500).json({ message: "Could not fetch your tickets" });
    }
};

export const getMyTicket = async (req, res) => {
    try {
        const ticket = await findTicket(req, res);
        if (!ticket) return;

        if (ticket.userUnread) {
            ticket.userUnread = false;
            await ticket.save();
        }

        res.status(200).json(ticket);
    } catch (error) {
        console.error("Get ticket error:", error.message);
        res.status(500).json({ message: "Could not fetch the ticket" });
    }
};

export const userReply = async (req, res) => {
    try {
        const message = readMessage(req.body.message, res);
        if (!message) return;

        const ticket = await findTicket(req, res);
        if (!ticket) return;

        if (ticket.messages.length >= MAX_MESSAGES) {
            return res.status(400).json({
                message: "This ticket is too long. Please create a new ticket",
            });
        }

        ticket.messages.push({ sender: "user", text: message });
        ticket.status = "open"; // resolved tha to dobara khul jata hai
        ticket.lastMessageAt = new Date();
        ticket.adminUnread = true;
        ticket.userUnread = false;
        await ticket.save();

        res.status(200).json({ message: "Reply sent", ticket });
    } catch (error) {
        console.error("User reply error:", error.message);
        res.status(500).json({ message: "Could not send your reply" });
    }
};

export const resolveTicket = async (req, res) => {
    try {
        const ticket = await findTicket(req, res);
        if (!ticket) return;

        ticket.status = "resolved";
        await ticket.save();

        res.status(200).json({ message: "Ticket marked as solved", ticket });
    } catch (error) {
        console.error("Resolve ticket error:", error.message);
        res.status(500).json({ message: "Could not update the ticket" });
    }
};

// ---------------- admin ----------------

export const getAllTickets = async (req, res) => {
    try {
        const { status } = req.query;
        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = 15;

        const filter = {};
        if (["open", "answered", "resolved"].includes(status)) {
            filter.status = status;
        }

        const [tickets, total] = await Promise.all([
            SupportTicket.find(filter)
                // jisko sabse pehle jawab chahiye wo upar
                .sort({ lastMessageAt: status === "open" ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select({ messages: { $slice: -1 } })
                .populate("user", "name email phone"),
            SupportTicket.countDocuments(filter),
        ]);

        res.status(200).json({
            tickets,
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        console.error("Get all tickets error:", error.message);
        res.status(500).json({ message: "Could not fetch tickets" });
    }
};

export const getTicketForAdmin = async (req, res) => {
    try {
        const ticket = await findTicket(req, res, { admin: true });
        if (!ticket) return;

        if (ticket.adminUnread) {
            ticket.adminUnread = false;
            await ticket.save();
        }

        res.status(200).json(ticket);
    } catch (error) {
        console.error("Admin get ticket error:", error.message);
        res.status(500).json({ message: "Could not fetch the ticket" });
    }
};

export const adminReply = async (req, res) => {
    try {
        const message = readMessage(req.body.message, res);
        if (!message) return;

        const ticket = await findTicket(req, res, { admin: true });
        if (!ticket) return;

        if (ticket.messages.length >= MAX_MESSAGES) {
            return res.status(400).json({
                message: "This ticket is too long. Ask the user to create a new ticket",
            });
        }

        ticket.messages.push({ sender: "admin", text: message });
        ticket.status = "answered";
        ticket.lastMessageAt = new Date();
        ticket.userUnread = true;
        ticket.adminUnread = false;
        await ticket.save();

        notify(ticket.user?._id, {
            type: "ticket_reply",
            title: "Support replied to your ticket",
            message: ticket.subject,
            link: `/support/${ticket._id}`,
        });

        res.status(200).json({ message: "Reply sent", ticket });
    } catch (error) {
        console.error("Admin reply error:", error.message);
        res.status(500).json({ message: "Could not send the reply" });
    }
};

export const setTicketStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["open", "answered", "resolved"].includes(status)) {
            return res.status(400).json({
                message: "Status must be open, answered or resolved",
            });
        }

        const ticket = await findTicket(req, res, { admin: true });
        if (!ticket) return;

        ticket.status = status;
        await ticket.save();

        res.status(200).json({ message: `Ticket marked as ${status}`, ticket });
    } catch (error) {
        console.error("Set ticket status error:", error.message);
        res.status(500).json({ message: "Could not update the ticket" });
    }
};