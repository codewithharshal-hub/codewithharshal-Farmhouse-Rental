import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getError } from "../services/api";
import MapView from "../components/MapView";
import { formatPrice } from "../utils/format";

const blank = { search: "", maxPrice: "", guests: "" };

export default function MapPage() {
    const navigate = useNavigate();

    const [filters, setFilters] = useState(blank);
    const [applied, setApplied] = useState(blank);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [formError, setFormError] = useState("");
    const [activeId, setActiveId] = useState("");
    const [focus, setFocus] = useState(null);
    const [view, setView] = useState("map");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const params = {};
                ["search", "maxPrice", "guests"].forEach((key) => {
                    if (applied[key]) params[key] = applied[key];
                });

                const { data } = await api.get("/map/farmhouses", { params });
                if (!cancelled) setItems(data);
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
    }, [applied]);

    function handleChange(e) {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    }

    function apply(e) {
        e.preventDefault();
        setFormError("");

        if (filters.maxPrice && !(Number(filters.maxPrice) >= 1)) {
            setFormError("Enter a valid maximum price.");
            return;
        }
        if (filters.guests && !(Number(filters.guests) >= 1)) {
            setFormError("Guests must be 1 or more.");
            return;
        }

        setActiveId("");
        setApplied({ ...filters });
    }

    function reset() {
        setFormError("");
        setFilters(blank);
        setApplied(blank);
        setActiveId("");
    }

    // list se click: map wahan jaye
    function pickFromList(id) {
        setActiveId(id);
        setFocus({ id, n: Date.now() });
        setView("map");
    }

    // map ke pin se click: list mein wo card dikhe
    function pickFromMap(id) {
        setActiveId(id);
        document.getElementById(`mp-${id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }

    return (
        <div className="mp-page">
            <form className="mp-filters" onSubmit={apply}>
                <div className="grow">
                    <label htmlFor="mp-search">Place or name</label>
                    <input id="mp-search" name="search" className="form-input" value={filters.search}
                        onChange={handleChange} placeholder="e.g. Pune, Lonavala" />
                </div>
                <div className="small">
                    <label htmlFor="mp-price">Max price (₹)</label>
                    <input id="mp-price" name="maxPrice" type="number" min="1" className="form-input"
                        value={filters.maxPrice} onChange={handleChange} placeholder="Any" />
                </div>
                <div className="small">
                    <label htmlFor="mp-guests">Guests</label>
                    <input id="mp-guests" name="guests" type="number" min="1" className="form-input"
                        value={filters.guests} onChange={handleChange} placeholder="Any" />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">Search</button>
                <button type="button" className="btn btn-outline btn-sm" onClick={reset}>Reset</button>
            </form>

            {formError && <div className="alert alert-error" style={{ margin: "8px 20px 0" }} role="alert">{formError}</div>}
            {error && <div className="alert alert-error" style={{ margin: "8px 20px 0" }} role="alert">{error}</div>}

            <div className="mp-tabs">
                <button type="button" className={`tab ${view === "map" ? "active" : ""}`} onClick={() => setView("map")}>Map</button>
                <button type="button" className={`tab ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>
                    List ({items.length})
                </button>
            </div>

            <div className={`mp-layout view-${view}`}>
                <aside className="mp-list">
                    {loading ? (
                        <>
                            <div className="skeleton" style={{ height: 96, marginBottom: 10 }} />
                            <div className="skeleton" style={{ height: 96, marginBottom: 10 }} />
                        </>
                    ) : items.length === 0 ? (
                        <div className="empty" style={{ padding: "30px 10px" }}>
                            <div className="empty-icon">🗺️</div>
                            <h3>No farmhouses on the map</h3>
                            <p className="muted">
                                Nothing matches, or no host has added a map pin yet. Hosts can edit a listing
                                and click on the map to place one.
                            </p>
                            <Link to="/my-listings" className="btn btn-outline btn-sm">Go to my listings</Link>
                        </div>
                    ) : (
                        <>
                            <p className="mp-count">{items.length} farmhouse{items.length === 1 ? "" : "s"} on the map</p>

                            {items.map((f) => (
                                <button key={f._id} id={`mp-${f._id}`} type="button"
                                    className={`mp-item ${activeId === f._id ? "active" : ""}`}
                                    onMouseEnter={() => setActiveId(f._id)}
                                    onClick={() => pickFromList(f._id)}>
                                    <span className="mp-thumb">
                                        {f.images?.[0] ? (
                                            <img src={f.images[0]} alt="" loading="lazy"
                                                onError={(e) => { e.currentTarget.style.display = "none"; }} />
                                        ) : (
                                            "🏡"
                                        )}
                                    </span>

                                    <span className="mp-info">
                                        <strong>{f.title}</strong>
                                        <span className="muted">📍 {f.location}</span>
                                        <span className="muted">
                                            {f.ratingCount > 0 ? `★ ${(f.ratingAverage || 0).toFixed(1)} (${f.ratingCount}) · ` : ""}
                                            👥 {f.maxGuests} · 🛏 {f.bedrooms}
                                        </span>
                                        <span className="mp-price">{formatPrice(f.pricePerNight)} <span className="muted">/ night</span></span>
                                    </span>
                                </button>
                            ))}
                        </>
                    )}
                </aside>

                <div className="mp-map">
                    <MapView
                        farmhouses={items}
                        activeId={activeId}
                        focus={focus}
                        onSelect={pickFromMap}
                        onOpen={(id) => navigate(`/farmhouses/${id}`)}
                    />
                </div>
            </div>
        </div>
    );
}