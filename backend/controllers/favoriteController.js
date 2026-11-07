import mongoose from "mongoose";
import Favorite from "../models/Favorite.js";
import Farmhouse from "../models/Farmhouse.js";

const MAX_FAVORITES = 200;

// sirf id ki list (hearts dikhane ke liye)
export const getFavoriteIds = async (req, res) => {
    try {
        const favorites = await Favorite.find({ user: req.user._id }).select("farmhouse");

        res.status(200).json({
            ids: favorites.map((f) => f.farmhouse.toString()),
        });
    } catch (error) {
        console.error("Get favorite ids error:", error.message);
        res.status(500).json({ message: "Could not fetch your favorites" });
    }
};

// poori farmhouses (Favorites page ke liye)
export const getFavorites = async (req, res) => {
    try {
        const favorites = await Favorite.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(MAX_FAVORITES)
            .populate({
                path: "farmhouse",
                match: { status: "approved", isAvailable: true },
                populate: { path: "owner", select: "name" },
            });

        // jo ab live nahi hain wo null aate hain
        const farmhouses = favorites.map((f) => f.farmhouse).filter(Boolean);

        res.status(200).json(farmhouses);
    } catch (error) {
        console.error("Get favorites error:", error.message);
        res.status(500).json({ message: "Could not fetch your favorites" });
    }
};

export const addFavorite = async (req, res) => {
    try {
        const { farmhouseId } = req.params;

        if (!mongoose.isValidObjectId(farmhouseId)) {
            return res.status(404).json({ message: "Farmhouse not found" });
        }

        const farmhouse = await Farmhouse.findOne({
            _id: farmhouseId,
            status: "approved",
            isAvailable: true,
        }).select("_id");

        if (!farmhouse) {
            return res.status(404).json({ message: "Farmhouse not found" });
        }

        const total = await Favorite.countDocuments({ user: req.user._id });

        if (total >= MAX_FAVORITES) {
            return res.status(400).json({
                message: `You can save up to ${MAX_FAVORITES} farmhouses`,
            });
        }

        try {
            await Favorite.updateOne(
                { user: req.user._id, farmhouse: farmhouseId },
                { $setOnInsert: { user: req.user._id, farmhouse: farmhouseId } },
                { upsert: true }
            );
        } catch (err) {
            if (err.code !== 11000) throw err; // pehle se saved hai, theek hai
        }

        res.status(201).json({ message: "Saved to favorites" });
    } catch (error) {
        console.error("Add favorite error:", error.message);
        res.status(500).json({ message: "Could not save this farmhouse" });
    }
};

export const removeFavorite = async (req, res) => {
    try {
        const { farmhouseId } = req.params;

        if (!mongoose.isValidObjectId(farmhouseId)) {
            return res.status(404).json({ message: "Farmhouse not found" });
        }

        await Favorite.deleteOne({ user: req.user._id, farmhouse: farmhouseId });

        res.status(200).json({ message: "Removed from favorites" });
    } catch (error) {
        console.error("Remove favorite error:", error.message);
        res.status(500).json({ message: "Could not remove this farmhouse" });
    }
};