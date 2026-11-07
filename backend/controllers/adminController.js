import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Contact from "../models/Contact.js";
import Farmhouse from "../models/Farmhouse.js";
import User from "../models/User.js";
import SupportTicket from "../models/SupportTicket.js";
import { notify } from "../utils/notify.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const readPage = (value) => Math.max(parseInt(value) || 1, 1);

export const getDashboardStats = async (req, res) => {
    try {
        const openTickets = await SupportTicket.countDocuments({ status: "open" });
        const [
            totalUsers,
            totalFarmhouses,
            pendingFarmhouses,
            approvedFarmhouses,
            rejectedFarmhouses,
            totalBookings,
            pendingBookings,
            confirmedBookings,
            newMessages,
            valueAgg,
        ] = await Promise.all([
            User.countDocuments(),
            Farmhouse.countDocuments(),
            Farmhouse.countDocuments({ status: "pending" }),
            Farmhouse.countDocuments({ status: "approved" }),
            Farmhouse.countDocuments({ status: "rejected" }),
            Booking.countDocuments(),
            Booking.countDocuments({ status: "pending" }),
            Booking.countDocuments({ status: "confirmed" }),
            Contact.countDocuments({ status: "new" }),
            Booking.aggregate([
                { $match: { status: "confirmed" } },
                { $group: { _id: null, total: { $sum: "$totalPrice" } } },
            ]),
        ]);

        res.status(200).json({
            totalUsers,
            totalFarmhouses,
            pendingFarmhouses,
            approvedFarmhouses,
            rejectedFarmhouses,
            totalBookings,
            pendingBookings,
            confirmedBookings,
            confirmedValue: valueAgg[0]?.total || 0,
            newMessages,
            openTickets,
        });
    } catch (error) {
        console.error("Dashboard error:", error.message);
        res.status(500).json({
            message: "Could not load dashboard data",
        });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const page = readPage(req.query.page);
        const limit = 15;

        const filter = {};
        const { search } = req.query;

        if (typeof search === "string" && search.trim()) {
            const rx = new RegExp(escapeRegex(search.trim()), "i");
            filter.$or = [{ name: rx }, { email: rx }];
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select("-password")
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit),
            User.countDocuments(filter),
        ]);

        res.status(200).json({
            users,
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        console.error("Get users error:", error.message);
        res.status(500).json({
            message: "Could not fetch users",
        });
    }
};

export const setUserBlocked = async (req, res) => {
    try {
        if (!User.schema.path("isBlocked")) {
            return res.status(500).json({
                message: "The User model is missing the isBlocked field",
            });
        }

        const { isBlocked } = req.body;

        if (typeof isBlocked !== "boolean") {
            return res.status(400).json({
                message: "isBlocked must be true or false",
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "User not found" });
        }

        if (req.params.id === req.user._id.toString()) {
            return res.status(400).json({
                message: "You cannot block yourself",
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin") {
            return res.status(400).json({
                message: "You cannot block another admin",
            });
        }

        user.isBlocked = isBlocked;
        await user.save();

        const safeUser = user.toObject();
        delete safeUser.password;

        res.status(200).json({
            message: isBlocked ? "User blocked" : "User unblocked",
            user: safeUser,
        });
    } catch (error) {
        console.error("Block user error:", error.message);
        res.status(500).json({
            message: "Could not update user",
        });
    }
};

export const getAllFarmhouses = async (req, res) => {
    try {
        const { status } = req.query;
        const page = readPage(req.query.page);
        const limit = 10;

        const filter = {};
        if (["pending", "approved", "rejected"].includes(status)) {
            filter.status = status;
        }

        const [farmhouses, total] = await Promise.all([
            Farmhouse.find(filter)
                // approval queue mein purani request pehle
                .sort({ createdAt: status === "pending" ? 1 : -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("owner", "name email phone"),
            Farmhouse.countDocuments(filter),
        ]);

        res.status(200).json({
            farmhouses,
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        console.error("Get farmhouses error:", error.message);
        res.status(500).json({
            message: "Could not fetch farmhouses",
        });
    }
};

export const updateFarmhouseStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["approved", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be approved or rejected",
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({
                message: "Farmhouse not found",
            });
        }

        const farmhouse = await Farmhouse.findByIdAndUpdate(
            req.params.id,
            { status },
            { returnDocument: "after" }).populate("owner", "name email phone");

        if (!farmhouse) {
            notify(farmhouse.owner?._id, {
                type: status === "approved" ? "listing_approved" : "listing_rejected",
                title: status === "approved" ? "Your farmhouse is live 🏡" : "Your listing was rejected",
                message:
                    status === "approved"
                        ? `"${farmhouse.title}" is now visible to guests.`
                        : `"${farmhouse.title}" was not approved. Edit the details and it will be reviewed again.`,
                link: status === "approved" ? `/farmhouses/${farmhouse._id}` : "/my-listings",
            });
            return res.status(404).json({
                message: "Farmhouse not found",
            });
        }

        res.status(200).json({
            message: `Farmhouse ${status}`,
            farmhouse,
        });
    } catch (error) {
        console.error("Update farmhouse status error:", error.message);
        res.status(500).json({
            message: "Could not update farmhouse",
        });
    }
};