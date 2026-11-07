export const CATEGORIES = [
    ["booking", "Booking"],
    ["listing", "My listing"],
    ["account", "Account"],
    ["technical", "Technical problem"],
    ["other", "Something else"],
];

export const categoryLabel = (id) => CATEGORIES.find(([key]) => key === id)?.[1] || "Other";

export const STATUS_LABEL = { open: "Open", answered: "Answered", resolved: "Resolved" };

// purane badge styles ko reuse karte hain
export const STATUS_BADGE = { open: "pending", answered: "confirmed", resolved: "cancelled" };

export const ticketNumber = (id) => `#${String(id).slice(-6).toUpperCase()}`;

export const formatDateTime = (d) =>
    new Date(d).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
    });