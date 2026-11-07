import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getError } from "../services/api";
import BookingBox from "../components/BookingBox";
import FavoriteButton from "../components/FavoriteButton";
import ReviewsSection from "../components/ReviewsSection";
import { Stars } from "../components/Stars";
import LocationMap from "../components/LocationMap";

export default function FarmhouseDetails() {
    const { id } = useParams();
    const [farmhouse, setFarmhouse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [active, setActive] = useState(0);
    const [rating, setRating] = useState({ average: 0, count: 0 });

    useEffect(() => {
        let cancelled = false;

        async function load() {
            setLoading(true);
            setError("");
            try {
                const { data } = await api.get(`/farmhouses/${id}`);
                if (!cancelled) {
                    setFarmhouse(data);
                    setActive(0);
                    setRating({ average: data.ratingAverage || 0, count: data.ratingCount || 0 });
                }
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
    }, [id]);

    if (loading) {
        return (
            <div className="container section">
                <div className="skeleton" style={{ height: 380 }} />
            </div>
        );
    }

    if (error || !farmhouse) {
        return (
            <div className="container section center">
                <h2>{error || "Farmhouse not found"}</h2>
                <Link to="/farmhouses" className="btn btn-primary">Back to farmhouses</Link>
            </div>
        );
    }

    const images = farmhouse.images || [];

    return (
        <div className="container section">
            <Link to="/farmhouses" className="back-link">← Back to farmhouses</Link>

            <div className="details-grid">
                <div>
                    <div className="gallery-main">
                        {images[active] ? (
                            <img src={images[active]} alt={farmhouse.title} />
                        ) : (
                            <span>🏡</span>
                        )}
                    </div>

                    {images.length > 1 && (
                        <div className="thumbs">
                            {images.map((src, i) => (
                                <button type="button" key={src + i}
                                    className={`thumb ${i === active ? "active" : ""}`}
                                    onClick={() => setActive(i)}>
                                    <img src={src} alt={`${farmhouse.title} ${i + 1}`} />
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="details-head">
                        <div>
                            <h1 className="details-title">{farmhouse.title}</h1>
                            <p className="muted" style={{ margin: 0 }}>📍 {farmhouse.location}</p>

                            {rating.count > 0 ? (
                                <a href="#reviews" className="rating-line">
                                    <Stars value={rating.average} size={16} />
                                    <strong>{rating.average.toFixed(1)}</strong>
                                    <span className="muted">
                                        ({rating.count} review{rating.count === 1 ? "" : "s"})
                                    </span>
                                </a>
                            ) : (
                                <p className="rating-line muted">No reviews yet</p>
                            )}
                        </div>

                        <FavoriteButton farmhouseId={farmhouse._id} className="fav-lg" />
                    </div>

                    <div className="stats">
                        <span>👥 {farmhouse.maxGuests} guests</span>
                        <span>🛏 {farmhouse.bedrooms} bedrooms</span>
                        {farmhouse.owner?.name && <span>🧑 Hosted by {farmhouse.owner.name}</span>}
                    </div>

                    <h3>About this place</h3>
                    <p className="description">{farmhouse.description}</p>

                    {farmhouse.amenities?.length > 0 && (
                        <>
                            <h3>Amenities</h3>
                            <div className="chips">
                                {farmhouse.amenities.map((a) => (
                                    <span className="chip" key={a}>{a}</span>
                                ))}
                            </div>
                        </>
                    )}

                    <LocationMap farmhouse={farmhouse} />

                    <ReviewsSection farmhouseId={farmhouse._id} onSummary={setRating} />
                </div>

                <aside className="booking-box card">
                    <BookingBox farmhouse={farmhouse} />
                </aside>
            </div>
        </div>
    );
}