import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getError } from "../services/api";

const STEPS = [
    { title: "List", text: "Add your farmhouse details, photos and map pin." },
    { title: "Get approved", text: "Our admin reviews every listing before it goes live." },
    { title: "Host", text: "Guests send booking requests. You confirm or reject each one." },
];

export default function BecomeHost() {
    const { user, becomeHost } = useAuth();

    const isHost = user?.role === "host";
    const needsPhone = isHost && !user?.phone;

    const [phone, setPhone] = useState(user?.phone || "");
    const [agree, setAgree] = useState(isHost); // host pehle hi confirm kar chuka hai
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        const digits = phone.replace(/[^\d+]/g, "");

        if (!/^\+?\d{10,14}$/.test(digits)) {
            setError("Please enter a valid phone number (10 to 14 digits).");
            return;
        }
        if (!agree) {
            setError("Please confirm that you own or manage the farmhouse you will list.");
            return;
        }

        setLoading(true);
        try {
            await becomeHost(phone);
            setDone(true);
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }

    if (done || (isHost && user?.phone)) {
        return (
            <div className="container section center">
                <div className="empty-icon">{done ? "🎉" : "🏡"}</div>
                <h2>{done ? (needsPhone ? "Phone number saved" : "You are now a host!") : "You are already a host"}</h2>
                <p className="muted">
                    {done
                        ? "Guests will see your phone number once you confirm their booking."
                        : "List your farmhouse and start getting booking requests."}
                </p>
                <div className="hero-actions">
                    <Link to="/farmhouses/new" className="btn btn-primary">List your farmhouse</Link>
                    <Link to="/booking-requests" className="btn btn-outline">Booking requests</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container section narrow">
            <h1>{needsPhone ? "Add your phone number" : "Become a host"}</h1>
            <p className="muted">
                {needsPhone
                    ? "Guests see your phone number after you confirm their booking, so they can reach you. It is also needed before you can confirm a booking."
                    : "Own a farmhouse? Switch to a host account to list it and earn from guests. Your guest account stays, so you can still book other farmhouses."}
            </p>

            {!needsPhone && (
                <div className="hm-steps" style={{ marginTop: 18 }}>
                    {STEPS.map((s, i) => (
                        <div className="hm-step" key={s.title}>
                            <span className="hm-num">{i + 1}</span>
                            <h3>{s.title}</h3>
                            <p className="muted">{s.text}</p>
                        </div>
                    ))}
                </div>
            )}

            <form className="form-card card" onSubmit={handleSubmit} noValidate>
                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <label htmlFor="phone">Your phone number</label>
                <input id="phone" className="form-input" value={phone}
                    onChange={(e) => { setPhone(e.target.value); if (error) setError(""); }}
                    placeholder="e.g. 9876543210" autoComplete="tel" />
                <p className="hint">Shared with a guest only after you confirm their booking.</p>

                {!isHost && (
                    <label className="check-row">
                        <input type="checkbox" checked={agree}
                            onChange={(e) => { setAgree(e.target.checked); if (error) setError(""); }} />
                        <span>I own, or am authorised to rent out, the farmhouse I will list.</span>
                    </label>
                )}

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? "Please wait..." : needsPhone ? "Save phone number" : "Become a host"}
                </button>
            </form>
        </div>
    );
}