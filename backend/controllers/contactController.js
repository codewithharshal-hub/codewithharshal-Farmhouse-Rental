import Contact from "../models/Contact.js";
import mongoose from "mongoose";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (value) => (typeof value === "string" ? value.trim() : "");

export const sendContactMessage = async (req, res) => {
    try {
        // honeypot: ye hidden field sirf bots bharte hain
        if (req.body.website) {
            return res.status(201).json({
                message: "Your message has been sent successfully",
            });
        }

        const name = text(req.body.name);
        const email = text(req.body.email).toLowerCase();
        const phone = text(req.body.phone);
        const subject = text(req.body.subject);
        const message = text(req.body.message);

        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                message: "Please fill all required fields",
            });
        }

        if (!EMAIL_RX.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address",
            });
        }

        if (
            name.length > 80 ||
            subject.length > 120 ||
            phone.length > 20 ||
            message.length > 2000
        ) {
            return res.status(400).json({
                message: "One of the fields is too long",
            });
        }

        if (message.length < 10) {
            return res.status(400).json({
                message: "Please write a slightly longer message (at least 10 characters)",
            });
        }

        await Contact.create({
            name,
            email,
            phone: phone || undefined,
            subject,
            message,
        });

        res.status(201).json({
            message: "Your message has been sent successfully",
        });
    } catch (error) {
        console.error("Send contact error:", error.message);
        res.status(500).json({
            message: "Could not send your message",
        });
    }
};

export const getContactMessages = async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });

        res.status(200).json(messages);
    } catch (error) {
        console.error("Get contact messages error:", error.message);
        res.status(500).json({
            message: "Could not fetch contact messages",
        });
    }
};

export const updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["new", "read", "resolved"].includes(status)) {
            return res.status(400).json({
                message: "Status must be new, read or resolved",
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Message not found" });
        }

        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { returnDocument: "after" });

        if (!contact) {
            return res.status(404).json({ message: "Message not found" });
        }

        res.status(200).json({
            message: `Message marked as ${status}`,
            contact,
        });
    } catch (error) {
        console.error("Update contact status error:", error.message);
        res.status(500).json({
            message: "Could not update message",
        });
    }
};