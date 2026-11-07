import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getError } from "../services/api";
import { formatDate, formatPrice, todayString } from "../utils/format";
import { useAuth } from "../context/AuthContext";

const TABS = [
    ["all", "All"],
    ["pending", "Pending"],
    ["confirmed", "Confirmed"],
    ["closed", "Rejected / cancelled"],
];

export default function BookingRequests() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyId, setBusyId] = useState("");
    const [tab, setTab] = useState("all");
    const { user } = useAuth();

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const { data } = await api.get("/bookings/farmhouse-bookings");
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

    async function updateStatus(id, status) {
        setError("");
        setNotice("");
        setBusyId(id);
        try {
            const { data } = await api.put(`/bookings/${id}/status`, { status });
            setBookings((prev) =>
                prev.map((b) => (b._id === id ? { ...b, status: data.booking.status } : b))
            );
            setNotice(`Booking ${status}.`);
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusyId("");
        }
    }

    const pendingCount = bookings.filter((b) => b.status === "pending").length;

    const shown = bookings.filter((b) => {
        if (tab === "all") return true;
        if (tab === "closed") return ["rejected", "cancelled"].includes(b.status);
        return b.status === tab;
    });

    return (
        <div className="container section narrow">
            <h1>Booking requests</h1>
            <p className="muted">
                Requests for your farmhouses.
                {pendingCount > 0 && ` ${pendingCount} waiting for your reply.`}
            </p>

            <div className="tabs">
                {TABS.map(([key, label]) => (
                    <button key={key} type="button"
                        className={`tab ${tab === key ? "active" : ""}`}
                        onClick={() => setTab(key)}>
                        {label}
                    </button>
                ))}
            </div>

            {!user?.phone && (
                <div className="alert alert-error" role="alert">
                    Add your phone number so guests can reach you after you confirm.{" "}
                    <Link to="/become-host">Add phone number</Link>
                </div>
            )}

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {notice && <div className="alert alert-success" role="status">{notice}</div>}

            {loading ? (
                <div className="skeleton" style={{ height: 140, marginTop: 20 }} />
            ) : shown.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">📭</div>
                    <h3>No requests here</h3>
                    <p className="muted">
                        {bookings.length === 0
                            ? "When guests book your farmhouse, requests will show up here."
                            : "Nothing in this tab."}
                    </p>
                    {bookings.length === 0 && (
                        <Link to="/my-listings" className="btn btn-outline">Go to my listings</Link>
                    )}
                </div>
            ) : (
                <div className="booking-list">
                    {shown.map((b) => {
                        const passed = b.checkIn.slice(0, 10) < todayString();

                        return (
                            <div className="bk-card" key={b._id}>
                                <div>
                                    <h3 className="bk-title">{b.farmhouse?.title || "Farmhouse removed"}</h3>
                                    <p className="bk-line">
                                        📅 {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                                    </p>
                                    <p className="bk-line">👥 {b.guests} guest{b.guests > 1 ? "s" : ""}</p>
                                    <p className="bk-line">
                                        🧑 {b.user?.name || "Guest"}
                                        {b.user?.email && <> · <a href={`mailto:${b.user.email}`}>{b.user.email}</a></>}
                                        {b.user?.phone && <> · <a href={`tel:${b.user.phone}`}>{b.user.phone}</a></>}
                                    </p>
                                    {b.status === "pending" && passed && (
                                        <p className="hint">The check-in date has passed, so you can only reject this.</p>
                                    )}
                                </div>

                                <div className="bk-side">
                                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                        <span className={`badge ${b.status}`}>{b.status}</span>
                                        {b.status === "confirmed" && (
                                            <span className={`badge ${b.paymentStatus === "paid" ? "confirmed" : "pending"}`}>
                                                {b.paymentStatus === "paid"
                                                    ? `Paid ${formatPrice(b.paidAmount || b.advanceAmount || Math.round(b.totalPrice * 0.3))}`
                                                    : "Advance Unpaid"}
                                            </span>
                                        )}
                                    </div>
                                    <p className="bk-total">{formatPrice(b.totalPrice)}</p>
                                    <Link to={`/bookings/${b._id}`} className="btn btn-outline btn-sm">Details</Link>

                                    {b.status === "pending" && (
                                        <div className="listing-actions">
                                            {!passed && (
                                                <button type="button" className="btn btn-primary btn-sm"
                                                    disabled={busyId === b._id}
                                                    onClick={() => updateStatus(b._id, "confirmed")}>
                                                    Confirm
                                                </button>
                                            )}
                                            <button type="button" className="btn btn-danger btn-sm"
                                                disabled={busyId === b._id}
                                                onClick={() => updateStatus(b._id, "rejected")}>
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}