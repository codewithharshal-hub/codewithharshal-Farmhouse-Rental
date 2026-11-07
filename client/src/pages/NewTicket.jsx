import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { getError } from "../services/api";
import { CATEGORIES } from "../utils/tickets";

const MAX = 2000;

export default function NewTicket() {
    const navigate = useNavigate();
    const [form, setForm] = useState({ subject: "", category: "booking", message: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!form.subject.trim() || !form.message.trim()) {
            setError("Please add a subject and describe your problem.");
            return;
        }
        if (form.message.trim().length < 10) {
            setError("Please describe the problem a little more (at least 10 characters).");
            return;
        }
        if (form.message.length > MAX) {
            setError(`Message is too long. Keep it under ${MAX} characters.`);
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post("/support", {
                subject: form.subject.trim(),
                category: form.category,
                message: form.message.trim(),
            });
            navigate(`/support/${data.ticket._id}`);
        } catch (err) {
            setError(getError(err));
            setLoading(false);
        }
    }

    return (
        <div className="container section narrow">
            <Link to="/support" className="back-link">← My tickets</Link>
            <h1>Raise a ticket</h1>
            <p className="muted">Tell us what went wrong. We will reply here.</p>

            <form className="form-card card" onSubmit={handleSubmit} noValidate>
                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <label htmlFor="category">What is it about?</label>
                <select id="category" name="category" className="form-input" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map(([id, label]) => (
                        <option key={id} value={id}>{label}</option>
                    ))}
                </select>

                <label htmlFor="subject">Subject</label>
                <input id="subject" name="subject" className="form-input" maxLength={120}
                    value={form.subject} onChange={handleChange} placeholder="Short summary of the problem" />

                <label htmlFor="message">Describe the problem</label>
                <textarea id="message" name="message" className="form-input" rows={6}
                    value={form.message} onChange={handleChange}
                    placeholder="What happened? Mention the farmhouse name or dates if it helps." />
                <p className={`char-count ${form.message.length > MAX ? "over" : ""}`}>
                    {form.message.length}/{MAX}
                </p>

                <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                    {loading ? "Submitting..." : "Submit ticket"}
                </button>
            </form>
        </div>
    );
}