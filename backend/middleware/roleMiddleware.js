// sirf host
export const hostOnly = (req, res, next) => {
    if (req.user && req.user.role === "host") return next();

    return res.status(403).json({
        message: "Only hosts can do this. Switch to a host account first",
    });
};

// admin ko user wale kaam nahi karne (book, favorites jaise)
export const notAdmin = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return res.status(403).json({
            message: "Admin accounts cannot use this feature",
        });
    }

    return next();
};