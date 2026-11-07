import bcrypt from "bcryptjs";
import User from "../models/User.js";

// server start hote hi .env ke hisaab se admin account bana ya update kar deta hai
export default async function seedAdmin() {
    const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "";
    const name = (process.env.ADMIN_NAME || "Admin").trim();

    if (!email || !password) {
        console.log("Admin seed skipped: set ADMIN_EMAIL and ADMIN_PASSWORD in .env");
        return;
    }

    if (password.length < 8) {
        console.log("Admin seed skipped: ADMIN_PASSWORD must be at least 8 characters");
        return;
    }

    try {
        const admin = await User.findOne({ email });

        if (!admin) {
            await User.create({
                name,
                email,
                password: await bcrypt.hash(password, 10),
                role: "admin",
            });
            console.log(`Admin account created: ${email}`);
            return;
        }

        let changed = false;

        if (admin.role !== "admin") {
            admin.role = "admin";
            changed = true;
        }

        if (admin.isBlocked) {
            admin.isBlocked = false;
            changed = true;
        }

        // .env ka password hi asli hai, badla to update
        if (!(await bcrypt.compare(password, admin.password))) {
            admin.password = await bcrypt.hash(password, 10);
            changed = true;
        }

        if (changed) {
            await admin.save();
            console.log(`Admin account updated: ${email}`);
        }
    } catch (error) {
        console.error("Admin seed failed:", error.message);
    }
}