import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        farmhouse: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Farmhouse",
            required: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

favoriteSchema.index({ user: 1, farmhouse: 1 }, { unique: true });
favoriteSchema.index({ farmhouse: 1 });

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;