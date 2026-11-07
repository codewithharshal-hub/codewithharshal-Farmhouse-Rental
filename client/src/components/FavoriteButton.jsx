import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";

export default function FavoriteButton({ farmhouseId, className = "" }) {
    const { user } = useAuth();
    const { isFavorite, toggle } = useFavorites();
    const navigate = useNavigate();
    const location = useLocation();

    const active = isFavorite(farmhouseId);

    function handleClick(e) {
        // card ka link na khule
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            navigate("/login", { state: { from: location } });
            return;
        }

        toggle(farmhouseId);
    }

    return (
        <button
            type="button"
            className={`fav-btn ${active ? "active" : ""} ${className}`}
            onClick={handleClick}
            aria-pressed={active}
            aria-label={active ? "Remove from favorites" : "Save to favorites"}
            title={active ? "Remove from favorites" : "Save to favorites"}
        >
            {active ? "♥" : "♡"}
        </button>
    );
}