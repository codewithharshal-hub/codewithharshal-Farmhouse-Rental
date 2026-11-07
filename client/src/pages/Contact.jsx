import { useState } from "react";
import { Link } from "react-router-dom";
import api, { getError } from "../services/api";
import { useAuth } from "../context/AuthContext";

const MAX_MESSAGE = 2000;
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
    const { user } = useAuth();

    const blank = () => ({
        name: user?.name || "",
        email: user?.email || "",
        phone: "",
        subject: "",
        message: "",
        website: "", // honeypot, user ko nahi dikhta
    });

    const [form, setForm] = useState(blank);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!form.name.trim() || !form.email.trim() || !form.subject.trim() || !form.message.trim()) {
            setError("Please fill name, email, subject and message.");
            return;
        }
        if (!EMAIL_RX.test(form.email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }
        if (form.message.trim().length < 10) {
            setError("Please write a slightly longer message (at least 10 characters).");
            return;
        }
        if (form.message.length > MAX_MESSAGE) {
            setError(`Message is too long. Keep it under ${MAX_MESSAGE} characters.`);
            return;
        }

        setLoading(true);
        try {
            await api.post("/contact", form);
            setSent(true);
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }

    function sendAnother() {
        setForm(blank());
        setSent(false);
    }

    if (sent) {
        return (
            <div className="container section center">
                <div className="empty-icon">✅</div>
                <h2>Message sent!</h2>
                <p className="muted">Thanks for reaching out. We will get back to you by email.</p>
                <div className="hero-actions">
                    <button type="button" className="btn btn-primary" onClick={sendAnother}>
                        Send another message
                    </button>
                    <Link to="/farmhouses" className="btn btn-outline">Browse farmhouses</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container section">
            <div className="page-head">
                <h1>Contact us</h1>
                <p className="muted">Questions, feedback or need help? Send us a message.</p>
            </div>

            <div className="contact-grid">
                <form className="card form-card" onSubmit={handleSubmit} noValidate>
                    {error && <div className="alert alert-error" role="alert">{error}</div>}

                    <div className="form-row two">
                        <div>
                            <label htmlFor="name">Your name</label>
                            <input id="name" name="name" className="form-input" value={form.name}
                                onChange={handleChange} maxLength={80} autoComplete="name" />
                        </div>
                        <div>
                            <label htmlFor="email">Email</label>
                            <input id="email" name="email" type="email" className="form-input" value={form.email}
                                onChange={handleChange} autoComplete="email" />
                        </div>
                    </div>

                    <div className="form-row two">
                        <div>
                            <label htmlFor="phone">Phone (optional)</label>
                            <input id="phone" name="phone" className="form-input" value={form.phone}
                                onChange={handleChange} maxLength={20} autoComplete="tel" />
                        </div>
                        <div>
                            <label htmlFor="subject">Subject</label>
                            <input id="subject" name="subject" className="form-input" value={form.subject}
                                onChange={handleChange} maxLength={120} />
                        </div>
                    </div>

                    <label htmlFor="message">Message</label>
                    <textarea id="message" name="message" className="form-input" rows={6}
                        value={form.message} onChange={handleChange} />
                    <p className={`char-count ${form.message.length > MAX_MESSAGE ? "over" : ""}`}>
                        {form.message.length}/{MAX_MESSAGE}
                    </p>

                    {/* honeypot: bots isse bharte hain, insaan ko ye dikhta hi nahi */}
                    <div className="hp" aria-hidden="true">
                        <label htmlFor="website">Leave this field empty</label>
                        <input id="website" name="website" tabIndex={-1} autoComplete="off"
                            value={form.website} onChange={handleChange} />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? "Sending..." : "Send message"}
                    </button>
                </form>

                <aside className="card tips">
                    <h3>Before you write</h3>
                    <ul>
                        <li>Booking status? Check <Link to="/my-bookings">My bookings</Link>.</li>
                        <li>Waiting for your listing to go live? Check <Link to="/my-listings">My listings</Link>.</li>
                        <li>Mention the farmhouse name if your question is about a specific place.</li>
                    </ul>
                </aside>
            </div>
        </div>
    );
}