import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getError } from "../services/api";
import { useNotifications } from "../context/NotificationsContext";
import NotificationItem from "../components/NotificationItem";

export default function Notifications() {
    const { unread, setUnread } = useNotifications();
    const navigate = useNavigate();

    const [tab, setTab] = useState("all");
    const [result, setResult] = useState({ notifications: [], page: 1, pages: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const params = { page: 1, limit: 15 };
                if (tab === "unread") params.unread = "1";

                const { data } = await api.get("/notifications", { params });

                if (!cancelled) {
                    setResult(data);
                    setUnread(data.unread);
                }
            } catch (err) {
                if (!cancelled) setError(getError(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [tab, setUnread]);

    async function loadMore() {
        setLoadingMore(true);
        try {
            const params = { page: result.page + 1, limit: 15 };
            if (tab === "unread") params.unread = "1";

            const { data } = await api.get("/notifications", { params });

            setResult((prev) => ({
                ...data,
                notifications: [...prev.notifications, ...data.notifications],
            }));
            setUnread(data.unread);
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoadingMore(false);
        }
    }

    function openItem(n) {
        if (!n.read) {
            setResult((prev) => ({
                ...prev,
                notifications: prev.notifications.map((x) => (x._id === n._id ? { ...x, read: true } : x)),
            }));
            setUnread(unread - 1);
            api.put(`/notifications/${n._id}/read`).catch(() => { });
        }

        if (n.link) navigate(n.link);
    }

    async function markAll() {
        setError("");
        try {
            await api.put("/notifications/read-all");
            setResult((prev) => ({
                ...prev,
                notifications: prev.notifications.map((x) => ({ ...x, read: true })),
            }));
            setUnread(0);
        } catch (err) {
            setError(getError(err));
        }
    }

    async function remove(n) {
        setError("");
        try {
            await api.delete(`/notifications/${n._id}`);
            setResult((prev) => ({
                ...prev,
                total: prev.total - 1,
                notifications: prev.notifications.filter((x) => x._id !== n._id),
            }));
            if (!n.read) setUnread(unread - 1);
        } catch (err) {
            setError(getError(err));
        }
    }

    const list = result.notifications;

    return (
        <div className="container section narrow">
            <div className="head-row">
                <div>
                    <h1>Notifications</h1>
                    <p className="muted">Updates about your bookings, listings and tickets.</p>
                </div>
                {unread > 0 && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={markAll}>
                        Mark all as read
                    </button>
                )}
            </div>

            <div className="tabs">
                <button type="button" className={`tab ${tab === "all" ? "active" : ""}`} onClick={() => setTab("all")}>
                    All
                </button>
                <button type="button" className={`tab ${tab === "unread" ? "active" : ""}`} onClick={() => setTab("unread")}>
                    Unread
                    {unread > 0 && <span className="count">{unread}</span>}
                </button>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            {loading ? (
                <div className="skeleton" style={{ height: 160, marginTop: 16 }} />
            ) : list.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">🔔</div>
                    <h3>{tab === "unread" ? "No unread notifications" : "Nothing here yet"}</h3>
                    <p className="muted">
                        {tab === "unread"
                            ? "You are all caught up."
                            : "When something happens with your bookings or listings, you will see it here."}
                    </p>
                </div>
            ) : (
                <div className="nt-card">
                    {list.map((n) => (
                        <div className="nt-row" key={n._id}>
                            <NotificationItem n={n} onOpen={openItem} />
                            <button type="button" className="nt-del" onClick={() => remove(n)} aria-label="Delete notification" title="Delete">
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {result.page < result.pages && (
                <div className="center" style={{ marginTop: 16 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore ? "Loading..." : "Show older"}
                    </button>
                </div>
            )}
        </div>
    );
}