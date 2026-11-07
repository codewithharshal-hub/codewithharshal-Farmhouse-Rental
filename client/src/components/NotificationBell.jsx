import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { useNotifications } from "../context/NotificationsContext";
import NotificationItem from "./NotificationItem";

export default function NotificationBell() {
    const { unread, setUnread } = useNotifications();
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        function onClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        function onKey(e) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    async function toggle() {
        const next = !open;
        setOpen(next);

        if (!next) return;

        setLoading(true);
        setFailed(false);
        try {
            const { data } = await api.get("/notifications", { params: { limit: 8 } });
            setItems(data.notifications);
            setUnread(data.unread);
        } catch {
            setFailed(true);
        } finally {
            setLoading(false);
        }
    }

    function openItem(n) {
        setOpen(false);

        if (!n.read) {
            setItems((prev) => prev.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
            setUnread(unread - 1);
            api.put(`/notifications/${n._id}/read`).catch(() => { });
        }

        if (n.link) navigate(n.link);
    }

    async function markAll() {
        try {
            await api.put("/notifications/read-all");
            setItems((prev) => prev.map((x) => ({ ...x, read: true })));
            setUnread(0);
        } catch {
            // agli polling sahi ginti le aayegi
        }
    }

    return (
        <div className="bell" ref={ref}>
            <button
                type="button"
                className="bell-btn"
                onClick={toggle}
                aria-expanded={open}
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            >
                <span aria-hidden="true">🔔</span>
                {unread > 0 && <span className="bell-badge">{unread > 99 ? "99+" : unread}</span>}
            </button>

            {open && (
                <div className="bell-panel" role="dialog" aria-label="Notifications">
                    <div className="bell-head">
                        <strong>Notifications</strong>
                        {unread > 0 && (
                            <button type="button" className="link-btn" onClick={markAll}>
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="bell-list">
                        {loading ? (
                            <p className="bell-empty">Loading...</p>
                        ) : failed ? (
                            <p className="bell-empty">Could not load notifications.</p>
                        ) : items.length === 0 ? (
                            <p className="bell-empty">You are all caught up. 🎉</p>
                        ) : (
                            items.map((n) => <NotificationItem key={n._id} n={n} onOpen={openItem} />)
                        )}
                    </div>

                    <Link to="/notifications" className="bell-foot" onClick={() => setOpen(false)}>
                        See all notifications
                    </Link>
                </div>
            )}
        </div>
    );
}