import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { getError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatPrice, nightsBetween, todayString } from "../utils/format";

export default function BookingBox({ farmhouse }) {
    const { user } = useAuth();
    const location = useLocation();

    const [form, setForm] = useState({ checkIn: "", checkOut: "", guests: 1 });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const nights = nightsBetween(form.checkIn, form.checkOut);
    const total = nights * farmhouse.pricePerNight;
    const isOwner = user && farmhouse.owner?._id === user.id;

    function handleChange(e) {
        setSuccess(false);
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setSuccess(false);

        const guests = Number(form.guests);

        if (!form.checkIn || !form.checkOut) {
            setError("Please choose check-in and check-out dates.");
            return;
        }
        if (form.checkIn < todayString()) {
            setError("Check-in date cannot be in the past.");
            return;
        }
        if (nights < 1) {
            setError("Check-out must be after check-in.");
            return;
        }
        if (!Number.isInteger(guests) || guests < 1 || guests > farmhouse.maxGuests) {
            setError(`Guests must be between 1 and ${farmhouse.maxGuests}.`);
            return;
        }

        setLoading(true);
        try {
            await api.post("/bookings", {
                farmhouseId: farmhouse._id,
                checkIn: form.checkIn,
                checkOut: form.checkOut,
                guests,
            });
            setSuccess(true);
            setForm({ checkIn: "", checkOut: "", guests: 1 });
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <p className="fh-price big">
                {formatPrice(farmhouse.pricePerNight)} <span>/ night</span>
            </p>

            {user?.role === "admin" ? (
                <p className="muted">Admin accounts cannot book farmhouses.</p>
            ) : isOwner ? (
                <p className="muted">This is your own listing, so you cannot book it.</p>
            ) : (
                <form onSubmit={handleSubmit} noValidate>
                    <div className="date-grid">
                        <div>
                            <label className="bk-label" htmlFor="checkIn">Check-in</label>
                            <input id="checkIn" name="checkIn" type="date" className="form-input"
                                min={todayString()} value={form.checkIn} onChange={handleChange} />
                        </div>
                        <div>
                            <label className="bk-label" htmlFor="checkOut">Check-out</label>
                            <input id="checkOut" name="checkOut" type="date" className="form-input"
                                min={form.checkIn || todayString()} value={form.checkOut} onChange={handleChange} />
                        </div>
                    </div>

                    <label className="bk-label" htmlFor="guests">Guests (max {farmhouse.maxGuests})</label>
                    <input id="guests" name="guests" type="number" min="1" max={farmhouse.maxGuests}
                        className="form-input" value={form.guests} onChange={handleChange} />

                    {nights > 0 && (
                        <div className="price-summary">
                            <div className="price-row">
                                <span>{formatPrice(farmhouse.pricePerNight)} × {nights} night{nights > 1 ? "s" : ""}</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                            <div className="price-row total">
                                <span>Total</span>
                                <span>{formatPrice(total)}</span>
                            </div>
                        </div>
                    )}

                    {error && <div className="alert alert-error" role="alert">{error}</div>}
                    {success && (
                        <div className="alert alert-success" role="status">
                            Booking request sent! <Link to="/my-bookings">View my bookings</Link>
                        </div>
                    )}

                    {user ? (
                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? "Sending..." : "Request to book"}
                        </button>
                    ) : (
                        <Link to="/login" state={{ from: location }} className="btn btn-primary btn-block">
                            Log in to book
                        </Link>
                    )}

                    <p className="hint">You will not be charged now. The host confirms your request first.</p>
                </form>
            )}
        </>
    );
}