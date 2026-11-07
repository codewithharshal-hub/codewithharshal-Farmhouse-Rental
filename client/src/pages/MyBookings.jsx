import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getError } from "../services/api";
import { formatDate, formatPrice, todayString } from "../utils/format";

export default function MyBookings() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyId, setBusyId] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const { data } = await api.get("/bookings/my-bookings");
                if (!cancelled) setBookings(data);
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

    async function cancel(id) {
        if (!window.confirm("Cancel this booking?")) return;

        setError("");
        setNotice("");
        setBusyId(id);
        try {
            const { data } = await api.put(`/bookings/${id}/cancel`);
            setBookings((prev) =>
                prev.map((b) => (b._id === id ? { ...b, status: data.booking.status } : b))
            );
            setNotice("Booking cancelled.");
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusyId("");
        }
    }

    return (
        <div className="container section narrow">
            <h1>My bookings</h1>
            <p className="muted">Your farmhouse booking requests and their status.</p>

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {notice && <div className="alert alert-success" role="status">{notice}</div>}

            {loading ? (
                <div className="skeleton" style={{ height: 140, marginTop: 20 }} />
            ) : bookings.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">🧳</div>
                    <h3>No bookings yet</h3>
                    <p className="muted">Find a farmhouse and send your first booking request.</p>
                    <Link to="/farmhouses" className="btn btn-primary">Browse farmhouses</Link>
                </div>
            ) : (
                <div className="booking-list">
                    {bookings.map((b) => {
                        const canCancel =
                            ["pending", "confirmed"].includes(b.status) &&
                            b.checkIn.slice(0, 10) >= todayString();

                        return (
                            <div className="bk-card" key={b._id}>
                                <div>
                                    <h3 className="bk-title">
                                        {b.farmhouse ? (
                                            <Link to={`/farmhouses/${b.farmhouse._id}`}>{b.farmhouse.title}</Link>
                                        ) : (
                                            "Farmhouse no longer available"
                                        )}
                                    </h3>
                                    {b.farmhouse && <p className="muted bk-line">📍 {b.farmhouse.location}</p>}
                                    <p className="bk-line">
                                        📅 {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                                    </p>
                                    <p className="bk-line">👥 {b.guests} guest{b.guests > 1 ? "s" : ""}</p>
                                </div>

                                <div className="bk-side">
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                        <span className={`badge ${b.status}`}>{b.status}</span>
                                        {b.status === "confirmed" && (
                                            <span className={`badge ${b.paymentStatus === "paid" ? "confirmed" : "pending"}`}>
                                                {b.paymentStatus === "paid"
                                                    ? `Paid ${formatPrice(b.paidAmount || b.advanceAmount || Math.round(b.totalPrice * 0.3))}`
                                                    : `Advance Due: ${formatPrice(b.advanceAmount || Math.round(b.totalPrice * 0.3))}`}
                                            </span>
                                        )}
                                    </div>
                                    <p className="bk-total">{formatPrice(b.totalPrice)}</p>
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                        {b.status === "confirmed" && b.paymentStatus !== "paid" && (
                                            <Link to={`/bookings/${b._id}`} className="btn btn-primary btn-sm">
                                                💳 Pay Advance
                                            </Link>
                                        )}
                                        <Link to={`/bookings/${b._id}`} className="btn btn-outline btn-sm">Details</Link>
                                        {canCancel && (
                                            <button type="button" className="btn btn-outline btn-sm"
                                                disabled={busyId === b._id} onClick={() => cancel(b._id)}>
                                                {busyId === b._id ? "Cancelling..." : "Cancel"}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}