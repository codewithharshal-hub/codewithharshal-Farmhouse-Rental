import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getError } from "../../services/api";

export default function AdminLogin() {
    const { user, adminLogin } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ email: "", password: "" });
    const [show, setShow] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // admin pehle se login hai to seedha panel
    if (user?.role === "admin") return <Navigate to="/admin" replace />;

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!form.email.trim() || !form.password) {
            setError("Please enter the admin email and password.");
            return;
        }

        setLoading(true);
        try {
            await adminLogin(form.email.trim(), form.password);
            navigate("/admin", { replace: true });
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit} noValidate>
                <span className="badge confirmed">Admin only</span>
                <h1 style={{ marginTop: 10 }}>Admin login</h1>
                <p className="muted">Sign in to approve listings, manage users and read messages.</p>

                {user && (
                    <div className="alert alert-error" role="status">
                        You are logged in as {user.name}. Logging in as admin will replace this session.
                    </div>
                )}

                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <label htmlFor="email">Admin email</label>
                <input id="email" name="email" type="email" value={form.email}
                    onChange={handleChange} placeholder="admin@farmhouse.com" autoComplete="username" />

                <label htmlFor="password">Password</label>
                <div className="pw-row">
                    <input id="password" name="password" type={show ? "text" : "password"}
                        value={form.password} onChange={handleChange}
                        placeholder="Admin password" autoComplete="current-password" />
                    <button type="button" className="pw-toggle" onClick={() => setShow(!show)}>
                        {show ? "Hide" : "Show"}
                    </button>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? "Signing in..." : "Sign in as admin"}
                </button>
            </form>
        </div>
    );
}