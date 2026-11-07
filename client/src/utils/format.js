export const formatPrice = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

// server dates UTC midnight pe hoti hain, isliye timeZone UTC
export const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });

// aaj ki date "YYYY-MM-DD" mein (user ke local time ke hisaab se)
export const todayString = () => new Date().toLocaleDateString("en-CA");

export const nightsBetween = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const n = Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000);
    return n > 0 ? n : 0;
};

// phone se WhatsApp link (10 digit ho to India ka 91 laga dete hain)
export const whatsappLink = (phone) => {
    let digits = String(phone || "").replace(/\D/g, "");
    if (digits.length === 10) digits = `91${digits}`;
    return digits ? `https://wa.me/${digits}` : "";
};

export const telLink = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;