import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getError } from "../services/api";
import { STATUS_BADGE, STATUS_LABEL, categoryLabel, formatDateTime, ticketNumber } from "../utils/tickets";

export default function MyTickets() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const { data } = await api.get("/support/my");
                if (!cancelled) setTickets(data);
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

    return (
        <div className="container section narrow">
            <div className="head-row">
                <div>
                    <h1>My tickets</h1>
                    <p className="muted">Your conversations with our support team.</p>
                </div>
                <Link to="/support/new" className="btn btn-primary">+ New ticket</Link>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            {loading ? (
                <div className="skeleton" style={{ height: 120, marginTop: 20 }} />
            ) : tickets.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">🎧</div>
                    <h3>No tickets yet</h3>
                    <p className="muted">Having a problem? Raise a ticket and we will help.</p>
                    <Link to="/support/new" className="btn btn-primary">Raise a ticket</Link>
                </div>
            ) : (
                <div className="booking-list">
                    {tickets.map((t) => {
                        const last = t.messages?.[t.messages.length - 1];

                        return (
                            <Link to={`/support/${t._id}`} className="ticket-card" key={t._id}>
                                <div>
                                    <div className="ticket-top">
                                        <span className="muted">{ticketNumber(t._id)}</span>
                                        <span className="chip small">{categoryLabel(t.category)}</span>
                                        {t.userUnread && <span className="new-dot">New reply</span>}
                                    </div>
                                    <h3 className="bk-title">{t.subject}</h3>
                                    {last && (
                                        <p className="muted bk-line ticket-preview">
                                            {last.sender === "admin" ? "Support: " : "You: "}{last.text}
                                        </p>
                                    )}
                                </div>

                                <div className="bk-side">
                                    <span className={`badge ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                                    <p className="hint">{formatDateTime(t.lastMessageAt)}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}