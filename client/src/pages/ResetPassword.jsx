import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getError } from "../services/api";

export default function ResetPassword() {
    const { token } = useParams();

    const [form, setForm] = useState({ password: "", confirm: "" });
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");
    const [expired, setExpired] = useState(false);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setExpired(false);

        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (form.password.length > 72) {
            setError("Password is too long (maximum 72 characters).");
            return;
        }
        if (form.password !== form.confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            await api.post("/auth/reset-password", { token, password: form.password });
            setDone(true);
        } catch (err) {
            const msg = getError(err);
            setError(msg);
            setExpired(/invalid or has expired/i.test(msg));
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <div className="auth-page">
                <div className="auth-card center">
                    <div className="empty-icon">✅</div>
                    <h1>Password updated</h1>
                    <p className="muted">Your password has been reset. You can now log in with the new one.</p>
                    <Link to="/login" className="btn btn-primary btn-block">Go to login</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit} noValidate>
                <h1>Set a new password</h1>
                <p className="muted">Choose a password you have not used before.</p>

                {error && (
                    <div className="alert alert-error" role="alert">
                        {error}
                        {expired && <> <Link to="/forgot-password">Request a new link</Link></>}
                    </div>
                )}

                <label htmlFor="password">New password</label>
                <div className="pw-row">
                    <input id="password" name="password" type={show ? "text" : "password"}
                        value={form.password} onChange={handleChange}
                        placeholder="At least 6 characters" autoComplete="new-password" />
                    <button type="button" className="pw-toggle" onClick={() => setShow(!show)}>
                        {show ? "Hide" : "Show"}
                    </button>
                </div>

                <label htmlFor="confirm">Confirm new password</label>
                <input id="confirm" name="confirm" type={show ? "text" : "password"}
                    value={form.confirm} onChange={handleChange}
                    placeholder="Repeat the password" autoComplete="new-password" />

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? "Saving..." : "Reset password"}
                </button>
            </form>
        </div>
    );
}