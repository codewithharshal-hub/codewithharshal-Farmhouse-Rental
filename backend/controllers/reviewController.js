import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Farmhouse from "../models/Farmhouse.js";
import Review from "../models/Review.js";
import { notify } from "../utils/notify.js";

const PAGE_SIZE = 6;
const MAX_COMMENT = 1000;

const text = (value) => (typeof value === "string" ? value.trim() : "");

// 1 se 5 ka poora number, warna null
const readRating = (value) => {
    if (value === "" || value === null || typeof value === "boolean") return null;
    const n = Number(value);
    return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};

// farmhouse ka average aur count dobara nikaal ke save karta hai
const recalcRating = async (farmhouseId) => {
    const [agg] = await Review.aggregate([
        { $match: { farmhouse: new mongoose.Types.ObjectId(String(farmhouseId)) } },
        { $group: { _id: "$farmhouse", avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    await Farmhouse.findByIdAndUpdate(farmhouseId, {
        ratingAverage: agg ? Math.round(agg.avg * 10) / 10 : 0,
        ratingCount: agg ? agg.count : 0,
    });
};

// guest ki confirmed booking hai aur check-out ho chuka hai?
const completedStay = (userId, farmhouseId) =>
    Booking.exists({
        user: userId,
        farmhouse: farmhouseId,
        status: "confirmed",
        checkOut: { $lte: new Date() },
    });

export const getFarmhouseReviews = async (req, res) => {
    try {
        const { farmhouseId } = req.params;

        if (!mongoose.isValidObjectId(farmhouseId)) {
            return res.status(404).json({ message: "Farmhouse not found" });
        }

        const farmhouse = await Farmhouse.findOne({
            _id: farmhouseId,
            status: "approved",
        }).select("_id");

        if (!farmhouse) {
            return res.status(404).json({ message: "Farmhouse not found" });
        }

        const page = Math.max(parseInt(req.query.page) || 1, 1);

        const [reviews, rows] = await Promise.all([
            Review.find({ farmhouse: farmhouseId })
                .sort({ createdAt: -1 })
                .skip((page - 1) * PAGE_SIZE)
                .limit(PAGE_SIZE)
                .populate("user", "name"),
            Review.aggregate([
                { $match: { farmhouse: new mongoose.Types.ObjectId(farmhouseId) } },
                { $group: { _id: "$rating", count: { $sum: 1 } } },
            ]),
        ]);

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let count = 0;
        let sum = 0;

        for (const row of rows) {
            distribution[row._id] = row.count;
            count += row.count;
            sum += row._id * row.count;
        }

        res.status(200).json({
            reviews,
            page,
            pages: Math.ceil(count / PAGE_SIZE),
            total: count,
            count,
            average: count ? Math.round((sum / count) * 10) / 10 : 0,
            distribution,
        });
    } catch (error) {
        console.error("Get reviews error:", error.message);
        res.status(500).json({ message: "Could not fetch reviews" });
    }
};

// login kiye hue guest ke liye: review de sakta hai ya nahi, aur uska purana review
export const getMyReviewStatus = async (req, res) => {
    try {
        const { farmhouseId } = req.params;

        if (!mongoose.isValidObjectId(farmhouseId)) {
            return res.status(404).json({ message: "Farmhouse not found" });
        }

        const [review, eligible] = await Promise.all([
            Review.findOne({ farmhouse: farmhouseId, user: req.user._id }),
            completedStay(req.user._id, farmhouseId),
        ]);

        res.status(200).json({ eligible: Boolean(eligible), review });
    } catch (error) {
        console.error("Review status error:", error.message);
        res.status(500).json({ message: "Could not check your review status" });
    }
};

export const createReview = async (req, res) => {
    try {
        const { farmhouseId } = req.body;

        if (!farmhouseId || !mongoose.isValidObjectId(farmhouseId)) {
            return res.status(404).json({ message: "Farmhouse not found" });
        }

        const rating = readRating(req.body.rating);

        if (rating === null) {
            return res.status(400).json({
                message: "Please choose a rating from 1 to 5 stars",
            });
        }

        const comment = text(req.body.comment);

        if (comment.length > MAX_COMMENT) {
            return res.status(400).json({
                message: `Review is too long. Keep it under ${MAX_COMMENT} characters`,
            });
        }

        const farmhouse = await Farmhouse.findOne({
            _id: farmhouseId,
            status: "approved",
        });

        if (!farmhouse) {
            return res.status(404).json({ message: "Farmhouse not found" });
        }

        if (farmhouse.owner.toString() === req.user._id.toString()) {
            return res.status(400).json({
                message: "You cannot review your own farmhouse",
            });
        }

        if (!(await completedStay(req.user._id, farmhouseId))) {
            return res.status(403).json({
                message: "Only guests with a completed, confirmed stay can leave a review",
            });
        }

        const already = await Review.exists({ farmhouse: farmhouseId, user: req.user._id });

        if (already) {
            return res.status(400).json({
                message: "You have already reviewed this farmhouse",
            });
        }

        let review;

        try {
            review = await Review.create({
                farmhouse: farmhouseId,
                user: req.user._id,
                rating,
                comment,
            });
        } catch (err) {
            // do request ek saath aayi to unique index rokta hai
            if (err.code === 11000) {
                return res.status(400).json({
                    message: "You have already reviewed this farmhouse",
                });
            }
            throw err;
        }

        await recalcRating(farmhouseId);

        notify(farmhouse.owner, {
            type: "review",
            title: "New review on your farmhouse",
            message: `${req.user.name} rated "${farmhouse.title}" ${rating} star${rating > 1 ? "s" : ""}.`,
            link: `/farmhouses/${farmhouse._id}`,
        });

        res.status(201).json({ message: "Thanks for your review", review });
    } catch (error) {
        console.error("Create review error:", error.message);
        res.status(500).json({ message: "Could not save your review" });
    }
};

export const updateReview = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Review not found" });
        }

        const review = await Review.findOne({ _id: req.params.id, user: req.user._id });

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        const rating = readRating(req.body.rating);

        if (rating === null) {
            return res.status(400).json({
                message: "Please choose a rating from 1 to 5 stars",
            });
        }

        const comment = text(req.body.comment);

        if (comment.length > MAX_COMMENT) {
            return res.status(400).json({
                message: `Review is too long. Keep it under ${MAX_COMMENT} characters`,
            });
        }

        review.rating = rating;
        review.comment = comment;
        await review.save();

        await recalcRating(review.farmhouse);

        res.status(200).json({ message: "Review updated", review });
    } catch (error) {
        console.error("Update review error:", error.message);
        res.status(500).json({ message: "Could not update your review" });
    }
};

export const deleteReview = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Review not found" });
        }

        const review = await Review.findOne({ _id: req.params.id, user: req.user._id });

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        await review.deleteOne();
        await recalcRating(review.farmhouse);

        res.status(200).json({ message: "Review deleted" });
    } catch (error) {
        console.error("Delete review error:", error.message);
        res.status(500).json({ message: "Could not delete your review" });
    }
};