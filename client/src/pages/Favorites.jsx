import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getError } from "../services/api";
import { useFavorites } from "../context/FavoritesContext";
import FarmhouseCard from "../components/FarmhouseCard";

export default function Favorites() {
    const { isFavorite, ready } = useFavorites();
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const { data } = await api.get("/favorites");
                if (!cancelled) setList(data);
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

    // heart hatane par card turant gayab ho jaye
    const shown = list.filter((f) => isFavorite(f._id));

    return (
        <div className="container section">
            <div className="page-head">
                <h1>Your favorites</h1>
                <p className="muted">Farmhouses you have saved for later.</p>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}

            {loading || !ready ? (
                <div className="fh-grid">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div className="skeleton" key={i} />
                    ))}
                </div>
            ) : shown.length === 0 ? (
                <div className="empty">
                    <div className="empty-icon">♡</div>
                    <h3>No favorites yet</h3>
                    <p className="muted">Tap the heart on any farmhouse to save it here.</p>
                    <Link to="/farmhouses" className="btn btn-primary">Browse farmhouses</Link>
                </div>
            ) : (
                <div className="fh-grid">
                    {shown.map((fh) => (
                        <FarmhouseCard key={fh._id} farmhouse={fh} />
                    ))}
                </div>
            )}
        </div>
    );
}