import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Farmhouse from "../models/Farmhouse.js";

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

await mongoose.connect(uri);

// jinki farmhouse pehle se listed hai unhe host bana do
const ownerIds = await Farmhouse.distinct("owner");

const result = await User.updateMany(
    { _id: { $in: ownerIds }, role: "user" },
    { $set: { role: "host" } }
);

console.log(`Hosts updated: ${result.modifiedCount}`);

await mongoose.disconnect();