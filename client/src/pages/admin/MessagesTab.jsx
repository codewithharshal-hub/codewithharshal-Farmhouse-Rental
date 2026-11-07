import { useEffect, useState } from "react";
import api, { getError } from "../../services/api";
import { formatDate } from "../../utils/format";

const FILTERS = [
    ["all", "All"],
    ["new", "New"],
    ["read", "Read"],
    ["resolved", "Resolved"],
];

export default function MessagesTab({ onChange }) {
    const [messages, setMessages] = useState([]);
    const [filter, setFilter] = useState("new");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const { data } = await api.get("/contact");
                if (!cancelled) setMessages(data);
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
    }, []);

    async function setStatus(id, status) {
        setError("");
        setBusyId(id);
        try {
            const { data } = await api.put(`/contact/${id}/status`, { status });
            setMessages((prev) =>
                prev.map((m) => (m._id === id ? { ...m, status: data.contact.status } : m))
            );
            onChange();
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusyId("");
        }
    }

    const shown = messages.filter((m) => filter === "all" || m.status === filter);

    return (
        <div>
            <div className="tabs sub">
                {FILTERS.map(([key, label]) => (
                    <button key={key} type="button"
                        className={`tab ${filter === key ? "active" : ""}`}
                        onClick={() => setFilter(key)}>
                        {label}
                    </button>
                ))}
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            {loading ? (
                <div className="skeleton" style={{ height: 160, marginTop: 16 }} />
            ) : shown.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">📭</div>
                    <h3>No messages here</h3>
                </div>
            ) : (
                <div className="booking-list">
                    {shown.map((m) => (
                        <div className="ad-card" key={m._id}>
                            <div className="msg-head">
                                <div>
                                    <h3 className="bk-title">{m.subject}</h3>
                                    <p className="bk-line">
                                        🧑 {m.name} · <a href={`mailto:${m.email}`}>{m.email}</a>
                                        {m.phone && <> · {m.phone}</>}
                                    </p>
                                    <p className="hint">{formatDate(m.createdAt)}</p>
                                </div>
                                <span className={`badge ${m.status === "new" ? "pending" : m.status === "resolved" ? "confirmed" : ""}`}>
                                    {m.status}
                                </span>
                            </div>

                            <p className="msg-text">{m.message}</p>

                            <div className="ad-actions">
                                <a className="btn btn-outline btn-sm"
                                    href={`mailto:${m.email}?subject=${encodeURIComponent("Re: " + m.subject)}`}>
                                    Reply by email
                                </a>
                                {m.status === "new" && (
                                    <button type="button" className="btn btn-outline btn-sm"
                                        disabled={busyId === m._id} onClick={() => setStatus(m._id, "read")}>
                                        Mark as read
                                    </button>
                                )}
                                {m.status === "read" && (
                                    <button type="button" className="btn btn-outline btn-sm"
                                        disabled={busyId === m._id} onClick={() => setStatus(m._id, "new")}>
                                        Mark as new
                                    </button>
                                )}
                                {m.status !== "resolved" ? (
                                    <button type="button" className="btn btn-primary btn-sm"
                                        disabled={busyId === m._id} onClick={() => setStatus(m._id, "resolved")}>
                                        Resolve
                                    </button>
                                ) : (
                                    <button type="button" className="btn btn-outline btn-sm"
                                        disabled={busyId === m._id} onClick={() => setStatus(m._id, "new")}>
                                        Reopen
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}