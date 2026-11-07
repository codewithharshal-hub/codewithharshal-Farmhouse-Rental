import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Farmhouse from "../models/Farmhouse.js";
import User from "../models/User.js";
import { notify } from "../utils/notify.js";
import {
    emailBookingConfirmed,
    emailBookingRejected,
    emailNewRequest,
} from "../utils/bookingEmails.js";

const MAX_NIGHTS = 30;
const DAY = 1000 * 60 * 60 * 24;

// "YYYY-MM-DD" ko Date (UTC midnight) banata hai, galat ho to null
const parseDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        return null;
    }
    return date;
};

const todayUTC = () => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
};

export const createBooking = async (req, res) => {
    try {
        const { farmhouseId, checkIn, checkOut } = req.body;

        if (!farmhouseId || !checkIn || !checkOut || req.body.guests === undefined) {
            return res.status(400).json({
                message: "Please fill all booking details",
            });
        }

        if (!mongoose.isValidObjectId(farmhouseId)) {
            return res.status(404).json({ message: "Farmhouse is not available" });
        }

        const startDate = parseDate(checkIn);
        const endDate = parseDate(checkOut);

        if (!startDate || !endDate) {
            return res.status(400).json({
                message: "Please choose valid check-in and check-out dates",
            });
        }

        if (startDate < todayUTC()) {
            return res.status(400).json({
                message: "Check-in date cannot be in the past",
            });
        }

        if (startDate >= endDate) {
            return res.status(400).json({
                message: "Check-out date must be after check-in date",
            });
        }

        const nights = Math.round((endDate - startDate) / DAY);

        if (nights > MAX_NIGHTS) {
            return res.status(400).json({
                message: `You can book a maximum of ${MAX_NIGHTS} nights at a time`,
            });
        }

        const guests = Number(req.body.guests);

        if (!Number.isInteger(guests) || guests < 1) {
            return res.status(400).json({
                message: "Guests must be a whole number (1 or more)",
            });
        }

        const farmhouse = await Farmhouse.findOne({
            _id: farmhouseId,
            status: "approved",
            isAvailable: true,
        });

        if (!farmhouse) {
            return res.status(404).json({
                message: "Farmhouse is not available",
            });
        }

        if (farmhouse.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({
                message: "You cannot book your own farmhouse",
            });
        }

        if (guests > farmhouse.maxGuests) {
            return res.status(400).json({
                message: `Maximum ${farmhouse.maxGuests} guests allowed`,
            });
        }

        const bookingExists = await Booking.findOne({
            farmhouse: farmhouseId,
            status: { $in: ["pending", "confirmed"] },
            checkIn: { $lt: endDate },
            checkOut: { $gt: startDate },
        });

        if (bookingExists) {
            return res.status(400).json({
                message: "Farmhouse is already booked for these dates",
            });
        }

        const advancePercentage = farmhouse.advancePercentage || 30;
        const advanceAmount = Math.round((nights * farmhouse.pricePerNight) * (advancePercentage / 100));

        const booking = await Booking.create({
            farmhouse: farmhouseId,
            user: req.user._id,
            checkIn: startDate,
            checkOut: endDate,
            guests,
            totalPrice: nights * farmhouse.pricePerNight,
            advanceAmount,
            paidAmount: 0,
            paymentStatus: "unpaid",
        });

        notify(farmhouse.owner, {
            type: "booking_request",
            title: "New booking request",
            message: `${req.user.name} requested "${farmhouse.title}" for ${nights} night${nights > 1 ? "s" : ""} (${guests} guest${guests > 1 ? "s" : ""}).`,
            link: "/booking-requests",
        });

        // host ko email (wait nahi karte)
        User.findById(farmhouse.owner)
            .select("name email phone")
            .then((host) => {
                if (host) emailNewRequest({ booking, farmhouse, guest: req.user, host });
            })
            .catch(() => { });

        res.status(201).json({
            message: "Booking request sent successfully",
            booking,
        });
    } catch (error) {
        console.error("Create booking error:", error.message);
        res.status(500).json({
            message: "Could not create booking",
        });
    }
};

export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id })
            .populate("farmhouse", "title location images pricePerNight advancePercentage")
            .sort({ createdAt: -1 });

        const enriched = bookings.map((b) => {
            const obj = b.toObject();
            const advance = obj.advanceAmount || Math.round(obj.totalPrice * ((obj.farmhouse?.advancePercentage || 30) / 100));
            const paid = obj.paidAmount || (obj.paymentStatus === "paid" ? advance : 0);
            return {
                ...obj,
                advanceAmount: advance,
                paidAmount: paid,
                remainingAmount: Math.max(0, obj.totalPrice - paid),
            };
        });

        res.status(200).json(enriched);
    } catch (error) {
        console.error("Get my bookings error:", error.message);
        res.status(500).json({
            message: "Could not fetch bookings",
        });
    }
};

export const getBookingsForMyFarmhouses = async (req, res) => {
    try {
        const myFarmhouses = await Farmhouse.find({
            owner: req.user._id,
        }).select("_id");

        const farmhouseIds = myFarmhouses.map((farmhouse) => farmhouse._id);

        const bookings = await Booking.find({
            farmhouse: { $in: farmhouseIds },
        })
            .populate("farmhouse", "title location advancePercentage")
            .populate("user", "name email phone")
            .sort({ createdAt: -1 });

        const enriched = bookings.map((b) => {
            const obj = b.toObject();
            const advance = obj.advanceAmount || Math.round(obj.totalPrice * ((obj.farmhouse?.advancePercentage || 30) / 100));
            const paid = obj.paidAmount || (obj.paymentStatus === "paid" ? advance : 0);
            return {
                ...obj,
                advanceAmount: advance,
                paidAmount: paid,
                remainingAmount: Math.max(0, obj.totalPrice - paid),
            };
        });

        res.status(200).json(enriched);
    } catch (error) {
        console.error("Get farmhouse bookings error:", error.message);
        res.status(500).json({
            message: "Could not fetch farmhouse booking requests",
        });
    }
};

// ek booking ki poori details (guest ya host dekh sakta hai)
export const getBookingDetails = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const booking = await Booking.findById(req.params.id)
            .populate({
                path: "farmhouse",
                select:
                    "title location images latitude longitude maxGuests bedrooms pricePerNight owner upiId advancePercentage +paymentInstructions +arrivalNotes",
            })
            .populate("user", "name email phone");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const farmhouse = booking.farmhouse;
        const me = req.user._id;

        const isGuest = Boolean(booking.user && booking.user._id.equals(me));
        const isHost = Boolean(farmhouse && farmhouse.owner.equals(me));

        // doosre ko pata hi nahi chalna chahiye ki ye booking hai
        if (!isGuest && !isHost) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const confirmed = booking.status === "confirmed";

        // host ka phone aur payment ki jaankari sirf confirm hone ke baad guest ko
        const revealToGuest = isGuest && confirmed && farmhouse;

        let host = null;

        if (confirmed && farmhouse) {
            const owner = await User.findById(farmhouse.owner).select("name email phone");
            if (owner) host = { name: owner.name, email: owner.email, phone: owner.phone || "" };
        }

        const nights = Math.max(
            1,
            Math.round((booking.checkOut - booking.checkIn) / DAY)
        );

        const advancePct = farmhouse?.advancePercentage || 30;
        const advanceAmount = booking.advanceAmount || Math.round(booking.totalPrice * (advancePct / 100));
        const paidAmount = booking.paidAmount || (booking.paymentStatus === "paid" ? advanceAmount : 0);
        const remainingAmount = Math.max(0, booking.totalPrice - paidAmount);

        // Host UPI: configured upiId > host phone@upi > platform default
        const phoneDigits = host?.phone ? host.phone.replace(/[^\d]/g, "") : "";
        const hostUpi = farmhouse?.upiId?.trim()
            ? farmhouse.upiId.trim()
            : phoneDigits
                ? `${phoneDigits}@upi`
                : "farmhouserental@upi";

        res.status(200).json({
            _id: booking._id,
            reference: `FR-${String(booking._id).slice(-6).toUpperCase()}`,
            status: booking.status,
            checkIn: booking.checkIn,
            checkOut: booking.checkOut,
            guests: booking.guests,
            nights,
            totalPrice: booking.totalPrice,
            advanceAmount,
            advancePercentage: advancePct,
            paidAmount,
            remainingAmount,
            paymentStatus: booking.paymentStatus || "unpaid",
            paymentMethod: booking.paymentMethod || "upi_qr",
            transactionId: booking.transactionId || "",
            paidAt: booking.paidAt || null,
            createdAt: booking.createdAt,
            viewerRole: isHost ? "host" : "guest",
            farmhouse: farmhouse
                ? {
                    _id: farmhouse._id,
                    title: farmhouse.title,
                    location: farmhouse.location,
                    images: farmhouse.images,
                    latitude: farmhouse.latitude,
                    longitude: farmhouse.longitude,
                    maxGuests: farmhouse.maxGuests,
                    bedrooms: farmhouse.bedrooms,
                    pricePerNight: farmhouse.pricePerNight,
                    upiId: hostUpi,
                    advancePercentage: advancePct,
                }
                : null,
            guest: isHost
                ? {
                    name: booking.user?.name || "Guest",
                    email: booking.user?.email || "",
                    phone: booking.user?.phone || "",
                }
                : null,
            host,
            paymentInstructions: revealToGuest ? farmhouse.paymentInstructions || "" : null,
            arrivalNotes: revealToGuest ? farmhouse.arrivalNotes || "" : null,
        });
    } catch (error) {
        console.error("Get booking details error:", error.message);
        res.status(500).json({ message: "Could not fetch the booking" });
    }
};

// host: pending booking ko confirm ya reject karta hai
export const updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!["confirmed", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be confirmed or rejected",
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const booking = await Booking.findById(req.params.id).populate("farmhouse");

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        if (!booking.farmhouse) {
            return res.status(404).json({
                message: "This farmhouse no longer exists",
            });
        }

        if (booking.farmhouse.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                message: "You cannot update this booking",
            });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({
                message: `This booking is already ${booking.status}`,
            });
        }

        if (status === "confirmed" && booking.checkIn < todayUTC()) {
            return res.status(400).json({
                message: "The check-in date has already passed",
            });
        }

        // guest ko host ka number dikhana hai, isliye host ke paas number hona chahiye
        if (status === "confirmed" && !req.user.phone) {
            return res.status(400).json({
                message: "Please add your phone number before confirming, so the guest can contact you",
            });
        }

        booking.status = status;
        await booking.save();

        notify(booking.user, {
            type: status === "confirmed" ? "booking_confirmed" : "booking_rejected",
            title: status === "confirmed" ? "Booking confirmed 🎉" : "Booking request rejected",
            message:
                status === "confirmed"
                    ? `"${booking.farmhouse.title}" is confirmed. Tap to see host contact and payment details.`
                    : `Your request for "${booking.farmhouse.title}" was rejected.`,
            link: status === "confirmed" ? `/bookings/${booking._id}` : "/my-bookings",
        });

        // guest ko email (wait nahi karte)
        (async () => {
            const [guest, farmhouse] = await Promise.all([
                User.findById(booking.user).select("name email phone"),
                Farmhouse.findById(booking.farmhouse._id).select("+paymentInstructions +arrivalNotes"),
            ]);

            if (!guest || !farmhouse) return;

            if (status === "confirmed") {
                await emailBookingConfirmed({ booking, farmhouse, guest, host: req.user });
            } else {
                await emailBookingRejected({ booking, farmhouse, guest });
            }
        })().catch((err) => console.error("Booking email failed:", err.message));

        res.status(200).json({
            message: `Booking ${status}`,
            booking,
        });
    } catch (error) {
        console.error("Update booking error:", error.message);
        res.status(500).json({
            message: "Could not update booking",
        });
    }
};

// host: payment mil gaya (ya galti se mark hua to wapas unpaid)
export const updatePaymentStatus = async (req, res) => {
    try {
        if (typeof req.body.paid !== "boolean") {
            return res.status(400).json({ message: "paid must be true or false" });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const booking = await Booking.findById(req.params.id).populate("farmhouse", "title owner advancePercentage");

        if (!booking || !booking.farmhouse) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.farmhouse.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You cannot update this booking" });
        }

        if (booking.status !== "confirmed") {
            return res.status(400).json({
                message: "Payment can only be updated for confirmed bookings",
            });
        }

        const advancePct = booking.farmhouse.advancePercentage || 30;
        const advanceAmount = booking.advanceAmount || Math.round(booking.totalPrice * (advancePct / 100));

        booking.paymentStatus = req.body.paid ? "paid" : "unpaid";
        booking.advanceAmount = advanceAmount;
        booking.paidAmount = req.body.paid
            ? (Number(req.body.amount) > 0 ? Number(req.body.amount) : (booking.paidAmount || advanceAmount))
            : 0;
        booking.paidAt = req.body.paid ? new Date() : undefined;
        if (req.body.paid && !booking.transactionId) {
            booking.transactionId = `HOST-CONFIRMED-${Date.now().toString().slice(-6)}`;
        }
        await booking.save();

        if (req.body.paid) {
            notify(booking.user, {
                type: "booking_confirmed",
                title: "Payment received",
                message: `The host marked payment of ₹${booking.paidAmount.toLocaleString("en-IN")} for "${booking.farmhouse.title}" as received.`,
                link: `/bookings/${booking._id}`,
            });
        }

        res.status(200).json({
            message: req.body.paid ? "Marked as paid" : "Marked as unpaid",
            paymentStatus: booking.paymentStatus,
            paidAmount: booking.paidAmount,
            advanceAmount: booking.advanceAmount,
            remainingAmount: Math.max(0, booking.totalPrice - booking.paidAmount),
            paidAt: booking.paidAt || null,
            transactionId: booking.transactionId || "",
        });
    } catch (error) {
        console.error("Update payment error:", error.message);
        res.status(500).json({ message: "Could not update the payment status" });
    }
};

// guest: advance payment pay karta hai (QR / UPI gateway)
export const payAdvanceBooking = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const booking = await Booking.findById(req.params.id).populate("farmhouse");

        if (!booking || !booking.farmhouse) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only pay for your own booking" });
        }

        if (booking.status !== "confirmed") {
            return res.status(400).json({
                message: "Payment can only be made after the host confirms the booking",
            });
        }

        if (booking.paymentStatus === "paid") {
            return res.status(400).json({
                message: `Payment already completed. Paid amount: ₹${booking.paidAmount || booking.advanceAmount}`,
            });
        }

        const advancePct = booking.farmhouse.advancePercentage || 30;
        const advanceAmount = booking.advanceAmount || Math.round(booking.totalPrice * (advancePct / 100));

        const { transactionId, paymentMethod = "upi_qr", amount } = req.body;
        const paidAmount = Number(amount) > 0 ? Number(amount) : advanceAmount;
        const txId = (typeof transactionId === "string" && transactionId.trim())
            ? transactionId.trim()
            : `UPI${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;

        booking.paymentStatus = "paid";
        booking.advanceAmount = advanceAmount;
        booking.paidAmount = paidAmount;
        booking.paidAt = new Date();
        booking.paymentMethod = paymentMethod;
        booking.transactionId = txId;

        await booking.save();

        notify(booking.farmhouse.owner, {
            type: "booking_confirmed",
            title: "Advance payment received! 💰",
            message: `${req.user.name} paid ₹${paidAmount.toLocaleString("en-IN")} advance for "${booking.farmhouse.title}" (Ref: ${txId}).`,
            link: `/bookings/${booking._id}`,
        });

        notify(booking.user, {
            type: "booking_confirmed",
            title: "Advance payment confirmed! 🎉",
            message: `Your advance payment of ₹${paidAmount.toLocaleString("en-IN")} for "${booking.farmhouse.title}" is confirmed.`,
            link: `/bookings/${booking._id}`,
        });

        res.status(200).json({
            message: `Advance payment of ₹${paidAmount.toLocaleString("en-IN")} received! Status updated to Paid.`,
            booking: {
                _id: booking._id,
                paymentStatus: booking.paymentStatus,
                paidAmount: booking.paidAmount,
                advanceAmount: booking.advanceAmount,
                remainingAmount: Math.max(0, booking.totalPrice - booking.paidAmount),
                paidAt: booking.paidAt,
                transactionId: booking.transactionId,
                paymentMethod: booking.paymentMethod,
            },
        });
    } catch (error) {
        console.error("Pay advance error:", error.message);
        res.status(500).json({ message: "Could not process advance payment" });
    }
};

// guest: apni booking cancel karta hai
export const cancelBooking = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Booking not found" });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only cancel your own bookings" });
        }

        if (!["pending", "confirmed"].includes(booking.status)) {
            return res.status(400).json({
                message: `This booking is already ${booking.status}`,
            });
        }

        if (booking.checkIn < todayUTC()) {
            return res.status(400).json({
                message: "Past bookings cannot be cancelled",
            });
        }

        booking.status = "cancelled";
        await booking.save();

        const cancelledFarmhouse = await Farmhouse.findById(booking.farmhouse).select("owner title");

        if (cancelledFarmhouse) {
            notify(cancelledFarmhouse.owner, {
                type: "booking_cancelled",
                title: "Booking cancelled",
                message: `${req.user.name} cancelled a booking for "${cancelledFarmhouse.title}".`,
                link: "/booking-requests",
            });
        }

        res.status(200).json({
            message: "Booking cancelled",
            booking,
        });
    } catch (error) {
        console.error("Cancel booking error:", error.message);
        res.status(500).json({
            message: "Could not cancel booking",
        });
    }
};