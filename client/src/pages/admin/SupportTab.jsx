import { useEffect, useState } from "react";
import api, { getError } from "../../services/api";
import TicketThread from "../../components/TicketThread";
import { STATUS_BADGE, STATUS_LABEL, categoryLabel, formatDateTime, ticketNumber } from "../../utils/tickets";

const FILTERS = [
    ["open", "Needs reply"],
    ["answered", "Answered"],
    ["resolved", "Resolved"],
    ["all", "All"],
];

export default function SupportTab({ onChange }) {
    const [filter, setFilter] = useState("open");
    const [page, setPage] = useState(1);
    const [result, setResult] = useState({ tickets: [], pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);

    const [openId, setOpenId] = useState("");
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const { data } = await api.get("/admin/support", { params: { status: filter, page } });
                if (!cancelled) setResult(data);
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
    }, [filter, page, reload]);

    function changeFilter(key) {
        setFilter(key);
        setPage(1);
        setOpenId("");
        setDetail(null);
    }

    // list ki row ko bina dobara load kiye update karta hai
    function patchRow(ticket) {
        setResult((prev) => ({
            ...prev,
            tickets: prev.tickets.map((t) =>
                t._id === ticket._id
                    ? {
                        ...t,
                        status: ticket.status,
                        lastMessageAt: ticket.lastMessageAt,
                        adminUnread: ticket.adminUnread,
                        messages: ticket.messages.slice(-1),
                    }
                    : t
            ),
        }));
    }

    async function toggle(id) {
        if (openId === id) {
            setOpenId("");
            setDetail(null);
            return;
        }

        setOpenId(id);
        setDetail(null);
        setDetailLoading(true);
        setError("");

        try {
            const { data } = await api.get(`/admin/support/${id}`);
            setDetail(data);
            patchRow(data);
        } catch (err) {
            setError(getError(err));
            setOpenId("");
        } finally {
            setDetailLoading(false);
        }
    }

    async function sendReply(message) {
        const { data } = await api.post(`/admin/support/${openId}/reply`, { message });
        setDetail(data.ticket);
        patchRow(data.ticket);
        onChange();
    }

    async function setStatus(status) {
        setBusy(true);
        setError("");
        try {
            const { data } = await api.put(`/admin/support/${openId}/status`, { status });
            setDetail(data.ticket);
            patchRow(data.ticket);
            onChange();
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    }

    const list = result.tickets || [];

    return (
        <div>
            <div className="tabs sub">
                {FILTERS.map(([key, label]) => (
                    <button key={key} type="button"
                        className={`tab ${filter === key ? "active" : ""}`}
                        onClick={() => changeFilter(key)}>
                        {label}
                    </button>
                ))}
                <button type="button" className="tab" onClick={() => setReload((r) => r + 1)}>↻ Refresh</button>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            {loading ? (
                <div className="skeleton" style={{ height: 160, marginTop: 16 }} />
            ) : list.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">🎉</div>
                    <h3>No tickets here</h3>
                    <p className="muted">{filter === "open" ? "Nothing is waiting for a reply." : "No tickets in this list."}</p>
                </div>
            ) : (
                <div className="booking-list">
                    {list.map((t) => {
                        const isOpen = openId === t._id;
                        const last = t.messages?.[t.messages.length - 1];

                        return (
                            <div className="ad-card" key={t._id}>
                                <button type="button" className="ticket-head" onClick={() => toggle(t._id)} aria-expanded={isOpen}>
                                    <div>
                                        <div className="ticket-top">
                                            <span className="muted">{ticketNumber(t._id)}</span>
                                            <span className="chip small">{categoryLabel(t.category)}</span>
                                            {t.adminUnread && <span className="new-dot">New</span>}
                                        </div>
                                        <h3 className="bk-title">{t.subject}</h3>
                                        <p className="bk-line muted">
                                            🧑 {t.user?.name || "Deleted user"}
                                            {last && <> · {last.sender === "admin" ? "You: " : ""}{last.text.slice(0, 80)}{last.text.length > 80 ? "…" : ""}</>}
                                        </p>
                                    </div>

                                    <div className="bk-side">
                                        <span className={`badge ${STATUS_BADGE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                                        <p className="hint">{formatDateTime(t.lastMessageAt)}</p>
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="ad-details">
                                        {detailLoading || !detail ? (
                                            <div className="skeleton" style={{ height: 160 }} />
                                        ) : (
                                            <>
                                                <p className="bk-line">
                                                    🧑 {detail.user?.name || "Deleted user"}
                                                    {detail.user?.email && <> · <a href={`mailto:${detail.user.email}`}>{detail.user.email}</a></>}
                                                    {detail.user?.phone && <> · <a href={`tel:${detail.user.phone}`}>{detail.user.phone}</a></>}
                                                </p>

                                                <TicketThread
                                                    messages={detail.messages}
                                                    viewer="admin"
                                                    onSend={sendReply}
                                                    resolved={detail.status === "resolved"}
                                                />

                                                <div className="ad-actions">
                                                    {detail.status !== "resolved" ? (
                                                        <button type="button" className="btn btn-primary btn-sm" disabled={busy}
                                                            onClick={() => setStatus("resolved")}>
                                                            ✓ Mark resolved
                                                        </button>
                                                    ) : (
                                                        <button type="button" className="btn btn-outline btn-sm" disabled={busy}
                                                            onClick={() => setStatus("open")}>
                                                            Reopen
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {result.pages > 1 && (
                <div className="pagination">
                    <button type="button" className="btn btn-outline btn-sm"
                        disabled={page <= 1} onClick={() => setPage(page - 1)}>← Previous</button>
                    <span>Page {page} of {result.pages}</span>
                    <button type="button" className="btn btn-outline btn-sm"
                        disabled={page >= result.pages} onClick={() => setPage(page + 1)}>Next →</button>
                </div>
            )}
        </div>
    );
}