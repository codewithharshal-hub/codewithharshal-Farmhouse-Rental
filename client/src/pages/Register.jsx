import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getError } from "../services/api";

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirm: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [intent, setIntent] = useState("guest");

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!form.name.trim() || !form.email.trim() || !form.password) {
            setError("Name, email and password are required.");
            return;
        }
        if (form.password.length < 6) {
            setError("Password must be at least 6 characters.");
            return;
        }
        if (form.password !== form.confirm) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            const { confirm, ...payload } = form;
            const data = await register({
                ...payload,
                name: payload.name.trim(),
                email: payload.email.trim(),
            });
            navigate(data.token ? (intent === "host" ? "/become-host" : "/") : "/login");
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit} noValidate>
                <h1>Create your account</h1>
                <p className="muted">One account to rent farmhouses and list your own.</p>

                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <label htmlFor="name">Full name</label>
                <input id="name" name="name" value={form.name} onChange={handleChange}
                    placeholder="Your name" autoComplete="name" />

                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={form.email}
                    onChange={handleChange} placeholder="you@example.com" autoComplete="email" />

                <label htmlFor="phone">Phone (optional)</label>
                <input id="phone" name="phone" value={form.phone} onChange={handleChange}
                    placeholder="Phone number" autoComplete="tel" />

                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" value={form.password}
                    onChange={handleChange} placeholder="At least 6 characters" autoComplete="new-password" />

                <label htmlFor="confirm">Confirm password</label>
                <input id="confirm" name="confirm" type="password" value={form.confirm}
                    onChange={handleChange} placeholder="Repeat your password" autoComplete="new-password" />

                <label>I want to</label>
                <div className="role-pick">
                    <label className={`role-card ${intent === "guest" ? "active" : ""}`}>
                        <input type="radio" name="intent" value="guest"
                            checked={intent === "guest"} onChange={() => setIntent("guest")} />
                        <strong>🧳 Book farmhouses</strong>
                        <span>Find and book a farmhouse for your stay.</span>
                    </label>
                    <label className={`role-card ${intent === "host" ? "active" : ""}`}>
                        <input type="radio" name="intent" value="host"
                            checked={intent === "host"} onChange={() => setIntent("host")} />
                        <strong>🏡 List my farmhouse</strong>
                        <span>I own a farmhouse and want to rent it out.</span>
                    </label>
                </div>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? "Creating account..." : "Sign up"}
                </button>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
            </form>
        </div>
    );
}