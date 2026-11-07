import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
    {
        farmhouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmhouse",
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        checkIn: { type: Date, required: true },
        checkOut: { type: Date, required: true },
        guests: { type: Number, required: true, min: 1 },
        totalPrice: { type: Number, required: true, min: 0 },
        advanceAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        paidAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "rejected", "cancelled"],
            default: "pending",
        },
        paymentStatus: {
            type: String,
            enum: ["unpaid", "paid"],
            default: "unpaid",
        },
        paymentMethod: {
            type: String,
            default: "upi_qr",
        },
        transactionId: {
            type: String,
            trim: true,
            default: "",
        },
        paidAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

bookingSchema.index({ farmhouse: 1, checkIn: 1, checkOut: 1 });

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
