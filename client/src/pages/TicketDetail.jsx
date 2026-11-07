import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getError } from "../services/api";
import TicketThread from "../components/TicketThread";
import { STATUS_BADGE, STATUS_LABEL, categoryLabel, formatDateTime, ticketNumber } from "../utils/tickets";

export default function TicketDetail() {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const { data } = await api.get(`/support/${id}`);
                if (!cancelled) setTicket(data);
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
    }, [id]);

    async function sendReply(message) {
        const { data } = await api.post(`/support/${id}/reply`, { message });
        setTicket(data.ticket);
        setNotice("");
    }

    async function markSolved() {
        if (!window.confirm("Mark this ticket as solved?")) return;

        setBusy(true);
        setError("");
        try {
            const { data } = await api.put(`/support/${id}/resolve`);
            setTicket(data.ticket);
            setNotice("Glad we could help. The ticket is marked as solved.");
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="container section narrow">
                <div className="skeleton" style={{ height: 300 }} />
            </div>
        );
    }

    if (!ticket) {
        return (
            <div className="container section center">
                <h2>{error || "Ticket not found"}</h2>
                <Link to="/support" className="btn btn-primary">Back to my tickets</Link>
            </div>
        );
    }

    return (
        <div className="container section narrow">
            <Link to="/support" className="back-link">← My tickets</Link>

            <div className="head-row">
                <div>
                    <p className="muted" style={{ margin: 0 }}>
                        {ticketNumber(ticket._id)} · {categoryLabel(ticket.category)} · {formatDateTime(ticket.createdAt)}
                    </p>
                    <h1 style={{ marginTop: 4 }}>{ticket.subject}</h1>
                </div>
                <span className={`badge ${STATUS_BADGE[ticket.status]}`}>{STATUS_LABEL[ticket.status]}</span>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {notice && <div className="alert alert-success" role="status">{notice}</div>}

            <TicketThread
                messages={ticket.messages}
                viewer="user"
                onSend={sendReply}
                resolved={ticket.status === "resolved"}
            />

            {ticket.status !== "resolved" && (
                <div className="solve-row">
                    <button type="button" className="btn btn-outline btn-sm" disabled={busy} onClick={markSolved}>
                        ✓ Mark as solved
                    </button>
                </div>
            )}
        </div>
    );
}