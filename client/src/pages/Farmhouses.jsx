import { useEffect, useState } from "react";
import api, { getError } from "../services/api";
import FarmhouseCard from "../components/FarmhouseCard";
import { useSearchParams } from "react-router-dom";

const emptyFilters = {
    search: "",
    minPrice: "",
    maxPrice: "",
    guests: "",
    sort: "newest",
};

  const SORTS = ["newest", "price_asc", "price_desc", "rating"];
function readParams(params) {
    const sort = params.get("sort");
    return {
        search: params.get("search") || "",
        minPrice: params.get("minPrice") || "",
        maxPrice: params.get("maxPrice") || "",
        guests: params.get("guests") || "",
        sort: SORTS.includes(sort) ? sort : "newest",
    };
}

export default function Farmhouses() {
    const [searchParams] = useSearchParams();
    const [filters, setFilters] = useState(() => readParams(searchParams));
    const [applied, setApplied] = useState(() => readParams(searchParams));
    const [page, setPage] = useState(1);
    const [result, setResult] = useState({ farmhouses: [], pages: 1, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterError, setFilterError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const params = { page, limit: 9, sort: applied.sort };
                ["search", "minPrice", "maxPrice", "guests"].forEach((key) => {
                    if (applied[key]) params[key] = applied[key];
                });

                const { data } = await api.get("/farmhouses", { params });
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
    }, [applied, page]);

    function handleChange(e) {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    }

    function handleSearch(e) {
        e.preventDefault();
        setFilterError("");

        if (
            filters.minPrice &&
            filters.maxPrice &&
            Number(filters.minPrice) > Number(filters.maxPrice)
        ) {
            setFilterError("Min price cannot be greater than max price.");
            return;
        }

        setPage(1);
        setApplied({ ...filters });
    }

    function handleReset() {
        setFilterError("");
        setFilters(emptyFilters);
        setApplied(emptyFilters);
        setPage(1);
    }

    function changePage(next) {
        setPage(next);
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const list = result.farmhouses || [];

    return (
        <div className="container">
            <div className="page-head">
                <h1>Find a farmhouse</h1>
                <p className="muted">Search by name or location and filter by price and guests.</p>
            </div>

            <form className="filters" onSubmit={handleSearch}>
                <div>
                    <label htmlFor="search">Search</label>
                    <input id="search" name="search" className="form-input" value={filters.search}
                        onChange={handleChange} placeholder="Name or location" />
                </div>
                <div>
                    <label htmlFor="minPrice">Min price (₹)</label>
                    <input id="minPrice" name="minPrice" type="number" min="0" className="form-input"
                        value={filters.minPrice} onChange={handleChange} placeholder="0" />
                </div>
                <div>
                    <label htmlFor="maxPrice">Max price (₹)</label>
                    <input id="maxPrice" name="maxPrice" type="number" min="0" className="form-input"
                        value={filters.maxPrice} onChange={handleChange} placeholder="Any" />
                </div>
                <div>
                    <label htmlFor="guests">Guests</label>
                    <input id="guests" name="guests" type="number" min="1" className="form-input"
                        value={filters.guests} onChange={handleChange} placeholder="Any" />
                </div>
                <div>
                    <label htmlFor="sort">Sort by</label>
                    <select id="sort" name="sort" className="form-input" value={filters.sort} onChange={handleChange}>
                        <option value="newest">Newest</option>
                        <option value="price_asc">Price: low to high</option>
                          <option value="rating">Top rated</option>
                        <option value="price_desc">Price: high to low</option>
                    </select>
                </div>
                <div className="filter-actions">
                    <button type="submit" className="btn btn-primary btn-sm">Search</button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleReset}>Reset</button>
                </div>
            </form>

            {filterError && <div className="alert alert-error" role="alert">{filterError}</div>}
            {error && <div className="alert alert-error" role="alert">{error}</div>}

            {loading ? (
                <div className="fh-grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div className="skeleton" key={i} />
                    ))}
                </div>
            ) : list.length === 0 && !error ? (
                <div className="empty">
                    <div className="empty-icon">🌾</div>
                    <h3>No farmhouses found</h3>
                    <p className="muted">Try changing your filters, or check back soon.</p>
                </div>
            ) : (
                <>
                    <p className="muted results-count">
                        {result.total} farmhouse{result.total === 1 ? "" : "s"} found
                    </p>
                    <div className="fh-grid">
                        {list.map((fh) => (
                            <FarmhouseCard key={fh._id} farmhouse={fh} />
                        ))}
                    </div>

                    {result.pages > 1 && (
                        <div className="pagination">
                            <button type="button" className="btn btn-outline btn-sm"
                                disabled={page <= 1} onClick={() => changePage(page - 1)}>
                                ← Previous
                            </button>
                            <span>Page {page} of {result.pages}</span>
                            <button type="button" className="btn btn-outline btn-sm"
                                disabled={page >= result.pages} onClick={() => changePage(page + 1)}>
                                Next →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}