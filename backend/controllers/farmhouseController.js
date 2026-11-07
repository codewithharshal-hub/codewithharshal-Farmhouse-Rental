import mongoose from "mongoose";
import Farmhouse from "../models/Farmhouse.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import Favorite from "../models/Favorite.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// string ya array ko saaf array of strings banata hai
const toList = (value) => {
    if (Array.isArray(value)) {
        return value.map((v) => String(v).trim()).filter(Boolean);
    }
    if (typeof value === "string") {
        return value.split(/[\n,]/).map((v) => v.trim()).filter(Boolean);
    }
    return undefined;
};

// number padhta hai, galat ho to null deta hai
const readNumber = (value, { min = 0, integer = false } = {}) => {
    if (value === "" || value === null || typeof value === "boolean") return null;
    const n = Number(value);
    if (!Number.isFinite(n) || n < min) return null;
    if (integer && !Number.isInteger(n)) return null;
    return n;
};

// latitude aur longitude dono saath aane chahiye (ya dono khaali)
const readCoords = (body) => {
    const empty = (v) => v === undefined || v === null || v === "";

    if (empty(body.latitude) && empty(body.longitude)) return { value: null };

    const latitude = readNumber(body.latitude, { min: -90 });
    const longitude = readNumber(body.longitude, { min: -180 });

    if (latitude === null || longitude === null || latitude > 90 || longitude > 180) {
        return { error: "Please choose a valid map location" };
    }

    return {
        value: {
            latitude: Math.round(latitude * 1e6) / 1e6,
            longitude: Math.round(longitude * 1e6) / 1e6,
        },
    };
};

// guest ke liye private text (max length ke saath)
const readNote = (value, max) => {
    if (value === undefined || value === null) return { value: "" };
    if (typeof value !== "string") return { error: true };

    const text = value.trim();
    if (text.length > max) return { error: true };

    return { value: text };
};

// sirf owner apni listing ko chhu sakta hai
const findOwnFarmhouse = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        res.status(404).json({ message: "Farmhouse not found" });
        return null;
    }

    const farmhouse = await Farmhouse.findById(req.params.id);

    if (!farmhouse) {
        res.status(404).json({ message: "Farmhouse not found" });
        return null;
    }

    if (farmhouse.owner.toString() !== req.user._id.toString()) {
        res.status(403).json({ message: "You can only manage your own farmhouses" });
        return null;
    }

    return farmhouse;
};

export const createFarmhouse = async (req, res) => {
    try {
        const { title, description, location } = req.body;

        if (
            typeof title !== "string" ||
            typeof description !== "string" ||
            typeof location !== "string" ||
            !title.trim() ||
            !description.trim() ||
            !location.trim()
        ) {
            return res.status(400).json({
                message: "Title, description and location are required",
            });
        }

        const pricePerNight = readNumber(req.body.pricePerNight, { min: 1 });
        const maxGuests = readNumber(req.body.maxGuests, { min: 1, integer: true });
        const bedrooms = readNumber(req.body.bedrooms, { min: 1, integer: true });

        if (pricePerNight === null || maxGuests === null || bedrooms === null) {
            return res.status(400).json({
                message: "Price, guests and bedrooms must be valid numbers (1 or more)",
            });
        }

        const coords = readCoords(req.body);

        if (coords.error) {
            return res.status(400).json({ message: coords.error });
        }

        const payment = readNote(req.body.paymentInstructions, 300);
        const arrival = readNote(req.body.arrivalNotes, 500);
        const upi = readNote(req.body.upiId, 60);

        if (payment.error || arrival.error || upi.error) {
            return res.status(400).json({
                message: "Payment instructions, arrival notes, or UPI ID is invalid or too long",
            });
        }

        const advancePercentage =
            readNumber(req.body.advancePercentage, { min: 10, integer: true }) || 30;

        const farmhouse = await Farmhouse.create({
            title: title.trim(),
            description: description.trim(),
            location: location.trim(),
            pricePerNight,
            maxGuests,
            bedrooms,
            amenities: toList(req.body.amenities) || [],
            images: toList(req.body.images) || [],
            ...(coords.value || {}),
            upiId: upi.value,
            advancePercentage: Math.min(Math.max(advancePercentage, 10), 100),
            paymentInstructions: payment.value,
            arrivalNotes: arrival.value,
            owner: req.user._id,
        });

        res.status(201).json({
            message: "Farmhouse submitted for admin approval",
            farmhouse,
        });
    } catch (error) {
        console.error("Create farmhouse error:", error.message);
        res.status(500).json({
            message: "Could not create farmhouse",
        });
    }
};

export const getFarmhouses = async (req, res) => {
    try {
        const { search, location, minPrice, maxPrice, guests, bedrooms, sort } = req.query;

        const page = Math.max(parseInt(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit) || 9, 1), 24);

        const filter = { status: "approved", isAvailable: true };

        if (typeof search === "string" && search.trim()) {
            const rx = new RegExp(escapeRegex(search.trim()), "i");
            filter.$or = [{ title: rx }, { location: rx }];
        }

        if (typeof location === "string" && location.trim()) {
            filter.location = new RegExp(escapeRegex(location.trim()), "i");
        }

        const price = {};
        if (minPrice && Number.isFinite(Number(minPrice))) price.$gte = Number(minPrice);
        if (maxPrice && Number.isFinite(Number(maxPrice))) price.$lte = Number(maxPrice);
        if (Object.keys(price).length) filter.pricePerNight = price;

        if (guests && Number(guests) > 0) filter.maxGuests = { $gte: Number(guests) };
        if (bedrooms && Number(bedrooms) > 0) filter.bedrooms = { $gte: Number(bedrooms) };

        const sorts = {
            newest: { createdAt: -1 },
            price_asc: { pricePerNight: 1 },
            price_desc: { pricePerNight: -1 },
            rating: { ratingAverage: -1, ratingCount: -1, createdAt: -1 },
        };
        const sortBy = Object.hasOwn(sorts, sort) ? sorts[sort] : sorts.newest;

        const [farmhouses, total] = await Promise.all([
            Farmhouse.find(filter)
                .sort(sortBy)
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("owner", "name"),
            Farmhouse.countDocuments(filter),
        ]);

        res.status(200).json({
            farmhouses,
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        console.error("Get farmhouses error:", error.message);
        res.status(500).json({
            message: "Could not fetch farmhouses",
        });
    }
};

export const getFarmhouseById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Farmhouse not found" });
        }

        const farmhouse = await Farmhouse.findOne({
            _id: req.params.id,
            status: "approved",
        }).populate("owner", "name");

        if (!farmhouse) {
            return res.status(404).json({
                message: "Farmhouse not found",
            });
        }

        res.status(200).json(farmhouse);
    } catch (error) {
        console.error("Get farmhouse error:", error.message);
        res.status(500).json({
            message: "Could not fetch farmhouse",
        });
    }
};

export const getMyFarmhouses = async (req, res) => {
    try {
        const farmhouses = await Farmhouse.find({ owner: req.user._id }).sort({

            createdAt: -1,
        });


        res.status(200).json(farmhouses);
    } catch (error) {
        console.error("Get my farmhouses error:", error.message);
        res.status(500).json({
            message: "Could not fetch your farmhouses",
        });
    }
};

export const updateFarmhouse = async (req, res) => {
    try {
        const farmhouse = await findOwnFarmhouse(req, res);
        if (!farmhouse) return;

        const body = req.body;
        let contentChanged = false;

        const setField = (field, value) => {
            if (JSON.stringify(farmhouse[field]) !== JSON.stringify(value)) {
                farmhouse[field] = value;
                contentChanged = true;
            }
        };

        for (const field of ["title", "description", "location"]) {
            if (body[field] !== undefined) {
                if (typeof body[field] !== "string" || !body[field].trim()) {
                    return res.status(400).json({ message: `${field} cannot be empty` });
                }
                setField(field, body[field].trim());
            }
        }

        const numberRules = {
            pricePerNight: { min: 1 },
            maxGuests: { min: 1, integer: true },
            bedrooms: { min: 1, integer: true },
        };

        for (const [field, rule] of Object.entries(numberRules)) {
            if (body[field] !== undefined) {
                const n = readNumber(body[field], rule);
                if (n === null) {
                    return res.status(400).json({ message: `${field} is not a valid number` });
                }
                setField(field, n);
            }
        }

        for (const field of ["amenities", "images"]) {
            if (body[field] !== undefined) {
                const list = toList(body[field]);
                if (!list) {
                    return res.status(400).json({ message: `${field} must be a list` });
                }
                setField(field, list);
            }
        }

        // map pin badalne par dobara approval nahi chahiye
        if (body.latitude !== undefined || body.longitude !== undefined) {
            const coords = readCoords(body);

            if (coords.error) {
                return res.status(400).json({ message: coords.error });
            }

            farmhouse.latitude = coords.value ? coords.value.latitude : undefined;
            farmhouse.longitude = coords.value ? coords.value.longitude : undefined;
        }

        for (const [field, max] of [["paymentInstructions", 300], ["arrivalNotes", 500], ["upiId", 60]]) {
            if (body[field] !== undefined) {
                const note = readNote(body[field], max);

                if (note.error) {
                    return res.status(400).json({ message: `${field} is too long (maximum ${max})` });
                }

                farmhouse[field] = note.value;
            }
        }

        if (body.advancePercentage !== undefined) {
            const adv = readNumber(body.advancePercentage, { min: 10, integer: true });
            if (adv !== null && adv <= 100) {
                farmhouse.advancePercentage = adv;
            }
        }

        if (typeof body.isAvailable === "boolean") {
            farmhouse.isAvailable = body.isAvailable;
        }

        // content badla to admin dobara approve kare
        if (contentChanged) farmhouse.status = "pending";

        await farmhouse.save();

        res.status(200).json({
            message: contentChanged
                ? "Farmhouse updated and sent for admin approval again"
                : "Farmhouse updated",
            farmhouse,
        });
    } catch (error) {
        console.error("Update farmhouse error:", error.message);
        res.status(500).json({
            message: "Could not update farmhouse",
        });
    }
};

export const updateFarmhouseUpi = async (req, res) => {
    try {
        const { upiId } = req.body;
        if (typeof upiId !== "string" || !upiId.trim() || !upiId.includes("@")) {
            return res.status(400).json({
                message: "Please enter a valid UPI ID (e.g. 9876543210@paytm or yourname@okhdfcbank)",
            });
        }

        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ message: "Farmhouse not found" });
        }

        const farmhouse = await Farmhouse.findById(req.params.id);
        if (!farmhouse) {
            return res.status(404).json({ message: "Farmhouse not found" });
        }

        farmhouse.upiId = upiId.trim();
        await farmhouse.save();

        res.status(200).json({
            message: "UPI ID saved successfully!",
            upiId: farmhouse.upiId,
        });
    } catch (error) {
        console.error("Update farmhouse UPI error:", error.message);
        res.status(500).json({ message: "Could not update UPI ID" });
    }
};

export const deleteFarmhouse = async (req, res) => {
    try {
        const farmhouse = await findOwnFarmhouse(req, res);
        if (!farmhouse) return;

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const upcoming = await Booking.countDocuments({
            farmhouse: farmhouse._id,
            status: { $in: ["pending", "confirmed"] },
            checkOut: { $gte: today },
        });

        if (upcoming > 0) {
            return res.status(400).json({
                message:
                    "You cannot delete a farmhouse that has upcoming bookings. Reject or cancel them first.",
            });
        }

        await farmhouse.deleteOne();

        await Promise.all([
            Review.deleteMany({ farmhouse: farmhouse._id }),
            Favorite.deleteMany({ farmhouse: farmhouse._id }),
        ]);

        res.status(200).json({ message: "Farmhouse deleted" });
    } catch (error) {
        console.error("Delete farmhouse error:", error.message);
        res.status(500).json({
            message: "Could not delete farmhouse",
        });
    }
};