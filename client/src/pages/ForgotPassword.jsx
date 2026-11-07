import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { getError } from "../services/api";

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    // "Send again" ka countdown
    useEffect(() => {
        if (cooldown <= 0) return;
        const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(id);
    }, [cooldown]);

    async function send() {
        setError("");

        const value = email.trim();

        if (!value) {
            setError("Please enter your email address.");
            return;
        }
        if (!EMAIL_RX.test(value)) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/forgot-password", { email: value });
            setSent(true);
            setCooldown(60);
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        send();
    }

    if (sent) {
        return (
            <div className="auth-page">
                <div className="auth-card center">
                    <div className="empty-icon">📬</div>
                    <h1>Check your email</h1>
                    <p className="muted">
                        If an account exists for <strong>{email.trim()}</strong>, we have sent a link to
                        reset your password. It works for 30 minutes.
                    </p>
                    <p className="hint">Do not see it? Check your spam folder.</p>

                    {error && <div className="alert alert-error" role="alert">{error}</div>}

                    <button type="button" className="btn btn-outline btn-block"
                        disabled={loading || cooldown > 0} onClick={send}>
                        {loading ? "Sending..." : cooldown > 0 ? `Send again in ${cooldown}s` : "Send again"}
                    </button>

                    <p className="auth-switch">
                        <button type="button" className="link-btn" onClick={() => { setSent(false); setError(""); }}>
                            Use a different email
                        </button>
                        {" · "}
                        <Link to="/login">Back to login</Link>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit} noValidate>
                <h1>Forgot your password?</h1>
                <p className="muted">Enter your email and we will send you a link to set a new one.</p>

                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={email}
                    onChange={(e) => { setEmail(e.target.value); if (error) setError(""); }}
                    placeholder="you@example.com" autoComplete="email" />

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? "Sending..." : "Send reset link"}
                </button>

                <p className="auth-switch">
                    Remembered it? <Link to="/login">Back to login</Link>
                </p>
            </form>
        </div>
    );
}