import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        role: {
            type: String,
            enum: ["user", "host", "admin"],
            default: "user",
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        phone: {
            type: String,
            trim: true,
        },
        passwordChangedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;