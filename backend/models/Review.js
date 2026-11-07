import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        farmhouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmhouse",
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
    },
    { timestamps: true }
);

// ek guest, ek farmhouse, ek review
reviewSchema.index({ farmhouse: 1, user: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

export default Review;