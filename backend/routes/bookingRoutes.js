import express from "express";
import {
    cancelBooking,
    createBooking,
    getBookingDetails,
    getBookingsForMyFarmhouses,
    getMyBookings,
    payAdvanceBooking,
    updateBookingStatus,
    updatePaymentStatus,
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";
import { hostOnly, notAdmin } from "../middleware/roleMiddleware.js";

const router = express.Router();

// user aur host dono book kar sakte hain, admin nahi
router.post("/", protect, notAdmin, createBooking);
router.get("/my-bookings", protect, notAdmin, getMyBookings);

// sirf host
router.get("/farmhouse-bookings", protect, hostOnly, getBookingsForMyFarmhouses);

// ek booking ki details (/:id wale routes sabse neeche)
router.get("/:id", protect, notAdmin, getBookingDetails);
router.put("/:id/cancel", protect, notAdmin, cancelBooking);
router.put("/:id/pay-advance", protect, notAdmin, payAdvanceBooking);
router.put("/:id/status", protect, hostOnly, updateBookingStatus);
router.put("/:id/payment", protect, hostOnly, updatePaymentStatus);

export default router;