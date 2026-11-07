import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getError } from "../../services/api";
import { formatDate, formatPrice } from "../../utils/format";

const FILTERS = [
    ["pending", "Pending"],
    ["approved", "Approved"],
    ["rejected", "Rejected"],
    ["all", "All"],
];

export default function FarmhousesTab({ onChange }) {
    const [filter, setFilter] = useState("pending");
    const [page, setPage] = useState(1);
    const [result, setResult] = useState({ farmhouses: [], pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busyId, setBusyId] = useState("");
    const [openId, setOpenId] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const { data } = await api.get("/admin/farmhouses", {
                    params: { status: filter, page },
                });
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
        setNotice("");
        setOpenId("");
    }

    async function setStatus(f, status) {
        if (status === "rejected" && !window.confirm(`Reject "${f.title}"? It will be hidden from guests.`)) {
            return;
        }

        setError("");
        setNotice("");
        setBusyId(f._id);
        try {
            await api.put(`/admin/farmhouses/${f._id}/status`, { status });
            setNotice(`"${f.title}" ${status}.`);
            onChange();

            if (result.farmhouses.length === 1 && page > 1) setPage(page - 1);
            else setReload((r) => r + 1);
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusyId("");
        }
    }

    const list = result.farmhouses || [];

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
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {notice && <div className="alert alert-success" role="status">{notice}</div>}

            {loading ? (
                <div className="skeleton" style={{ height: 160, marginTop: 16 }} />
            ) : list.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">🎉</div>
                    <h3>Nothing here</h3>
                    <p className="muted">
                        {filter === "pending" ? "No listings are waiting for approval." : "No farmhouses in this list."}
                    </p>
                </div>
            ) : (
                <div className="booking-list">
                    {list.map((f) => {
                        const open = openId === f._id;

                        return (
                            <div className="ad-card" key={f._id}>
                                <div className="ad-top">
                                    <div className="listing-img">
                                        {f.images?.[0] ? (
                                            <img src={f.images[0]} alt={f.title}
                                                onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                        ) : (
                                            <span>🏡</span>
                                        )}
                                    </div>

                                    <div className="ad-info">
                                        <h3 className="bk-title">{f.title}</h3>
                                        <p className="muted bk-line">📍 {f.location}</p>
                                        <p className="bk-line">
                                            {formatPrice(f.pricePerNight)} / night · 👥 {f.maxGuests} · 🛏 {f.bedrooms}
                                        </p>
                                        <p className="bk-line">
                                            🧑 {f.owner?.name || "Unknown"}
                                            {f.owner?.email && <> · <a href={`mailto:${f.owner.email}`}>{f.owner.email}</a></>}
                                            {f.owner?.phone && <> · {f.owner.phone}</>}
                                        </p>
                                        <p className="hint">Submitted {formatDate(f.createdAt)}</p>
                                    </div>

                                    <div className="ad-side">
                                        <span className={`badge ${f.status}`}>{f.status}</span>
                                        {!f.isAvailable && f.status === "approved" && (
                                            <span className="badge cancelled">hidden by owner</span>
                                        )}
                                    </div>
                                </div>

                                {open && (
                                    <div className="ad-details">
                                        <h4>Description</h4>
                                        <p className="description">{f.description}</p>

                                        {f.amenities?.length > 0 && (
                                            <>
                                                <h4>Amenities</h4>
                                                <div className="chips">
                                                    {f.amenities.map((a) => <span className="chip" key={a}>{a}</span>)}
                                                </div>
                                            </>
                                        )}

                                        {f.images?.length > 0 && (
                                            <>
                                                <h4>Photos</h4>
                                                <div className="thumbs">
                                                    {f.images.map((src, i) => (
                                                        <a href={src} target="_blank" rel="noreferrer" className="thumb" key={src + i}>
                                                            <img src={src} alt={`${f.title} ${i + 1}`} />
                                                        </a>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="ad-actions">
                                    <button type="button" className="btn btn-outline btn-sm"
                                        onClick={() => setOpenId(open ? "" : f._id)}>
                                        {open ? "Hide details" : "View details"}
                                    </button>

                                    {f.status === "approved" && (
                                        <Link to={`/farmhouses/${f._id}`} className="btn btn-outline btn-sm">
                                            Open live page
                                        </Link>
                                    )}

                                    {f.status !== "approved" && (
                                        <button type="button" className="btn btn-primary btn-sm"
                                            disabled={busyId === f._id} onClick={() => setStatus(f, "approved")}>
                                            Approve
                                        </button>
                                    )}
                                    {f.status !== "rejected" && (
                                        <button type="button" className="btn btn-danger btn-sm"
                                            disabled={busyId === f._id} onClick={() => setStatus(f, "rejected")}>
                                            Reject
                                        </button>
                                    )}
                                </div>
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