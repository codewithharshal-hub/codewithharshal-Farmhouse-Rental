import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar() {
    const navigate = useNavigate();
    const [where, setWhere] = useState("");
    const [guests, setGuests] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [error, setError] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (guests && (!Number.isInteger(Number(guests)) || Number(guests) < 1)) {
            setError("Guests must be a whole number (1 or more).");
            return;
        }
        if (maxPrice && !(Number(maxPrice) >= 1)) {
            setError("Enter a valid maximum price.");
            return;
        }

        const params = new URLSearchParams();
        if (where.trim()) params.set("search", where.trim());
        if (guests) params.set("guests", guests);
        if (maxPrice) params.set("maxPrice", maxPrice);

        const query = params.toString();
        navigate(query ? `/farmhouses?${query}` : "/farmhouses");
    }

    return (
        <form className="hm-search" onSubmit={handleSubmit} noValidate>
            <div>
                <label htmlFor="hs-where">Where to?</label>
                <input id="hs-where" className="form-input" value={where}
                    onChange={(e) => setWhere(e.target.value)} placeholder="City, village or farmhouse name" />
            </div>
            <div>
                <label htmlFor="hs-guests">Guests</label>
                <input id="hs-guests" type="number" min="1" className="form-input" value={guests}
                    onChange={(e) => setGuests(e.target.value)} placeholder="Any" />
            </div>
            <div>
                <label htmlFor="hs-price">Max price / night (₹)</label>
                <input id="hs-price" type="number" min="1" className="form-input" value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)} placeholder="Any" />
            </div>
            <button type="submit" className="btn btn-primary hm-search-btn">Search</button>

            {error && <div className="hm-search-error" role="alert">{error}</div>}
        </form>
    );
}