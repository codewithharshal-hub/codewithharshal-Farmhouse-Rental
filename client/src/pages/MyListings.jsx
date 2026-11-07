import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { getError } from "../services/api";
import { formatPrice } from "../utils/format";

const statusNote = {
    pending: "Waiting for admin approval. Guests cannot see it yet.",
    approved: "Live. Guests can find and book it.",
    rejected: "Rejected by admin. Edit the details and it will be reviewed again.",
};

export default function MyListings() {
    const location = useLocation();
    const [farmhouses, setFarmhouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState(() => location.state?.notice || "");
    const [busyId, setBusyId] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const { data } = await api.get("/farmhouses/my");
                if (!cancelled) setFarmhouses(data);
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

    async function toggleAvailable(f) {
        setError("");
        setNotice("");
        setBusyId(f._id);
        try {
            const { data } = await api.put(`/farmhouses/${f._id}`, {
                isAvailable: !f.isAvailable,
            });
            setFarmhouses((prev) => prev.map((x) => (x._id === f._id ? data.farmhouse : x)));
            setNotice(f.isAvailable ? "Listing hidden from guests." : "Listing is visible again.");
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusyId("");
        }
    }

    async function remove(f) {
        if (!window.confirm(`Delete "${f.title}"? This cannot be undone.`)) return;

        setError("");
        setNotice("");
        setBusyId(f._id);
        try {
            await api.delete(`/farmhouses/${f._id}`);
            setFarmhouses((prev) => prev.filter((x) => x._id !== f._id));
            setNotice("Farmhouse deleted.");
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusyId("");
        }
    }

    return (
        <div className="container section narrow">
            <div className="head-row">
                <div>
                    <h1>My listings</h1>
                    <p className="muted">Manage the farmhouses you have listed.</p>
                </div>
                <Link to="/farmhouses/new" className="btn btn-primary">+ Add farmhouse</Link>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {notice && <div className="alert alert-success" role="status">{notice}</div>}

            {loading ? (
                <div className="skeleton" style={{ height: 150, marginTop: 20 }} />
            ) : farmhouses.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">🏡</div>
                    <h3>You have not listed any farmhouse yet</h3>
                    <p className="muted">List your first farmhouse and start getting booking requests.</p>
                    <Link to="/farmhouses/new" className="btn btn-primary">List a farmhouse</Link>
                </div>
            ) : (
                <div className="booking-list">
                    {farmhouses.map((f) => (
                        <div className="listing-card" key={f._id}>
                            <div className="listing-img">
                                {f.images?.[0] ? (
                                    <img src={f.images[0]} alt={f.title}
                                        onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                ) : (
                                    <span>🏡</span>
                                )}
                            </div>

                            <div className="listing-info">
                                <h3 className="bk-title">
                                    {f.status === "approved" ? (
                                        <Link to={`/farmhouses/${f._id}`}>{f.title}</Link>
                                    ) : (
                                        f.title
                                    )}
                                </h3>
                                <p className="muted bk-line">📍 {f.location}</p>
                                <p className="bk-line">
                                    {formatPrice(f.pricePerNight)} / night · 👥 {f.maxGuests} · 🛏 {f.bedrooms}
                                </p>
                                <p className="bk-line">
                                    <span className={`badge ${f.status}`}>{f.status}</span>
                                    {f.status === "approved" && !f.isAvailable && (
                                        <span className="badge cancelled" style={{ marginLeft: 6 }}>hidden</span>
                                    )}
                                </p>
                                <p className="hint">{statusNote[f.status]}</p>
                                {f.latitude == null && <p className="hint">📍 No map pin yet. Click Edit to add one.</p>}
                            </div>

                            <div className="listing-actions">
                                <Link to={`/farmhouses/${f._id}/edit`} className="btn btn-outline btn-sm">Edit</Link>
                                {f.status === "approved" && (
                                    <button type="button" className="btn btn-outline btn-sm"
                                        disabled={busyId === f._id} onClick={() => toggleAvailable(f)}>
                                        {f.isAvailable ? "Hide" : "Show"}
                                    </button>
                                )}
                                <button type="button" className="btn btn-danger btn-sm"
                                    disabled={busyId === f._id} onClick={() => remove(f)}>
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}