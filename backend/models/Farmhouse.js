import mongoose from "mongoose";

const farmhouseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
            trim: true,
        },
        pricePerNight: {
            type: Number,
            required: true,
            min: 0,
        },
        maxGuests: {
            type: Number,
            required: true,
            min: 1,
        },
        bedrooms: {
            type: Number,
            required: true,
            min: 1,
        },
        amenities: {
            type: [String],
            default: [],
        },
        images: {
            type: [String],
            default: [],
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        ratingAverage: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        ratingCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        latitude: {
            type: Number,
            min: -90,
            max: 90,
        },
        longitude: {
            type: Number,
            min: -180,
            max: 180,
        },
        upiId: {
            type: String,
            trim: true,
            maxlength: 60,
            default: "",
        },
        advancePercentage: {
            type: Number,
            min: 10,
            max: 100,
            default: 30,
        },
        paymentInstructions: {
            type: String,
            trim: true,
            maxlength: 300,
            default: "",
            select: false,
        },
        arrivalNotes: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
            select: false,
        },
    },
    {
        timestamps: true,
    }
);

const Farmhouse = mongoose.model("Farmhouse", farmhouseSchema);

export default Farmhouse;