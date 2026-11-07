import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};

const userResponse = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
});

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Name, email and password are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters",
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const userExists = await User.findOne({ email: cleanEmail });

        if (userExists) {
            return res.status(400).json({
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name: name.trim(),
            email: cleanEmail,
            phone: typeof phone === "string" ? phone.trim() : undefined,
            password: hashedPassword,
        });

        res.status(201).json({
            message: "Registration successful",
            token: generateToken(user._id),
            user: userResponse(user),
        });
    } catch (error) {
        console.error("Register error:", error.message);
        res.status(500).json({
            message: "Registration failed",
        });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);

        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Invalid email or password",
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                message: "Your account has been blocked. Please contact support.",
            });
        }

        res.status(200).json({
            message: "Login successful",
            token: generateToken(user._id),
            user: userResponse(user),
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({
            message: "Login failed",
        });
    }
};

export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required",
            });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        // normal user ho ya password galat ho, dono pe ek hi message
        const valid =
            user &&
            user.role === "admin" &&
            (await bcrypt.compare(password, user.password));

        if (!valid) {
            return res.status(401).json({
                message: "Invalid admin email or password",
            });
        }

        if (user.isBlocked) {
            return res.status(403).json({
                message: "This account has been blocked",
            });
        }

        res.status(200).json({
            message: "Admin login successful",
            token: generateToken(user._id),
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Admin login error:", error.message);
        res.status(500).json({
            message: "Login failed",
        });
    }
};

// har baar login nahi, par frontend ko sahi role pata chalta rahe
export const getMe = async (req, res) => {
    const u = req.user;

    res.status(200).json({
        user: {
            id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            phone: u.phone,
        },
    });
};

export const becomeHost = async (req, res) => {
    try {
        if (req.user.role === "admin") {
            return res.status(403).json({
                message: "Admin accounts cannot become hosts",
            });
        }

        const { phone, agree } = req.body;

        if (agree !== true) {
            return res.status(400).json({
                message: "Please confirm that you own or manage the farmhouse you will list",
            });
        }

        const cleanPhone = typeof phone === "string" ? phone.replace(/[^\d+]/g, "") : "";

        if (!/^\+?\d{10,14}$/.test(cleanPhone)) {
            return res.status(400).json({
                message: "Please enter a valid phone number (10 to 14 digits)",
            });
        }

        const user = await User.findById(req.user._id);

        user.role = "host";
        user.phone = cleanPhone;
        await user.save();

        res.status(200).json({
            message: "You are now a host",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
            },
        });
    } catch (error) {
        console.error("Become host error:", error.message);
        res.status(500).json({
            message: "Could not switch your account to a host account",
        });
    }
};