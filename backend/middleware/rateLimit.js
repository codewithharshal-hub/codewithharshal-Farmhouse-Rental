// chhota in-memory rate limiter (ek IP se kitni requests)
export const rateLimit = ({ windowMs, max, message }) => {
    const hits = new Map();

    // purani entries saaf karta rehta hai
    setInterval(() => {
        const now = Date.now();
        for (const [key, times] of hits) {
            const recent = times.filter((t) => now - t < windowMs);
            if (recent.length) hits.set(key, recent);
            else hits.delete(key);
        }
    }, windowMs).unref();

    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip;
        const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);

        if (recent.length >= max) {
            return res.status(429).json({ message });
        }

        recent.push(now);
        hits.set(key, recent);
        next();
    };
};