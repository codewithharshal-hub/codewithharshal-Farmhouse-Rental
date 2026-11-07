import Notification from "../models/Notification.js";

// notification banana kabhi asli kaam (booking, review...) ko fail nahi karna chahiye,
// isliye error sirf terminal mein dikhta hai
export async function notify(userId, { type, title, message = "", link = "" }) {
    try {
        if (!userId) return;

        await Notification.create({
            user: userId,
            type,
            title,
            message: String(message).slice(0, 300),
            link,
        });
    } catch (error) {
        console.error("Notification failed:", error.message);
    }
}