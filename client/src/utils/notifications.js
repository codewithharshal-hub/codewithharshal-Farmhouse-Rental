const ICONS = {
    booking_request: "📩",
    booking_confirmed: "✅",
    booking_rejected: "⛔",
    booking_cancelled: "❌",
    review: "⭐",
    listing_approved: "🏡",
    listing_rejected: "⚠️",
    ticket_reply: "🎧",
};

export const iconFor = (type) => ICONS[type] || "🔔";

export function timeAgo(date) {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 45) return "just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${Math.max(minutes, 1)}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}