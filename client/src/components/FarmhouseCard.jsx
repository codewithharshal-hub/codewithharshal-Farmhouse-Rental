import { Link } from "react-router-dom";
import { formatPrice } from "../utils/format";
import FavoriteButton from "./FavoriteButton";

export default function FarmhouseCard({ farmhouse }) {
    const {
        _id, title, location, pricePerNight, maxGuests, bedrooms, images,
        ratingAverage, ratingCount,
    } = farmhouse;

    const cover = images?.[0];

    return (
        <div className="fh-wrap">
            <Link to={`/farmhouses/${_id}`} className="fh-card">
                <div className="fh-img">
                    {cover ? (
                        <img
                            src={cover}
                            alt={title}
                            loading="lazy"
                            onError={(e) => {
                                e.currentTarget.style.display = "none";
                            }}
                        />
                    ) : (
                        <span>🏡</span>
                    )}
                </div>

                <div className="fh-body">
                    <h3 className="fh-title">{title}</h3>

                    {ratingCount > 0 ? (
                        <p className="fh-rating">
                            <span className="star">★</span> {(ratingAverage || 0).toFixed(1)}
                            <span className="muted"> ({ratingCount})</span>
                        </p>
                    ) : (
                        <p className="fh-rating new">New</p>
                    )}

                    <p className="fh-loc">📍 {location}</p>
                    <p className="fh-meta">
                        👥 {maxGuests} guests · 🛏 {bedrooms} bedrooms
                    </p>
                    <p className="fh-price">
                        {formatPrice(pricePerNight)} <span>/ night</span>
                    </p>
                </div>
            </Link>

            <FavoriteButton farmhouseId={_id} className="fh-fav" />
        </div>
    );
}