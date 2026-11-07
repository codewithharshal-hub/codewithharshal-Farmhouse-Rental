import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getError } from "../services/api";

export default function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || "/";

    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!form.email.trim() || !form.password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);
        try {
            await login(form.email.trim(), form.password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit} noValidate>
                <h1>Welcome back</h1>
                <p className="muted">Log in to book a farmhouse or manage your listings.</p>

                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={form.email}
                    onChange={handleChange} placeholder="you@example.com" autoComplete="email" />

                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" value={form.password}
                    onChange={handleChange} placeholder="Your password" autoComplete="current-password" />

                <div className="forgot-row">
                    <Link to="/forgot-password">Forgot password?</Link>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? "Logging in..." : "Log in"}
                </button>

                <p className="auth-switch">
                    New here? <Link to="/register">Create an account</Link>
                </p>
            </form>
        </div>
    );
}