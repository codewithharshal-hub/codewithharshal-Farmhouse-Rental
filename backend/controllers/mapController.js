import Farmhouse from "../models/Farmhouse.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// sirf wahi farmhouses jinka map pin laga hai
export const getMapFarmhouses = async (req, res) => {
    try {
        const { search, minPrice, maxPrice, guests } = req.query;

        const filter = {
            status: "approved",
            isAvailable: true,
            latitude: { $ne: null },
            longitude: { $ne: null },
        };

        if (typeof search === "string" && search.trim()) {
            const rx = new RegExp(escapeRegex(search.trim()), "i");
            filter.$or = [{ title: rx }, { location: rx }];
        }

        const price = {};
        if (minPrice && Number.isFinite(Number(minPrice))) price.$gte = Number(minPrice);
        if (maxPrice && Number.isFinite(Number(maxPrice))) price.$lte = Number(maxPrice);
        if (Object.keys(price).length) filter.pricePerNight = price;

        if (guests && Number(guests) > 0) filter.maxGuests = { $gte: Number(guests) };

        const farmhouses = await Farmhouse.find(filter)
            .sort({ ratingAverage: -1, createdAt: -1 })
            .limit(300)
            .select(
                "title location pricePerNight maxGuests bedrooms images ratingAverage ratingCount latitude longitude"
            );

        // map ko sirf pehli photo chahiye
        res.status(200).json(
            farmhouses.map((f) => ({
                ...f.toObject(),
                images: (f.images || []).slice(0, 1),
            }))
        );
    } catch (error) {
        console.error("Map farmhouses error:", error.message);
        res.status(500).json({ message: "Could not load the map" });
    }
};