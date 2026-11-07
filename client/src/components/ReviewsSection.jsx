import { useCallback, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api, { getError } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { formatDate } from "../utils/format";
import { StarInput, Stars } from "./Stars";

const MAX = 1000;

// "Rahul Sharma" ko "Rahul S." dikhata hai
const shortName = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "Guest";
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

function ReviewForm({ initial, submitLabel, onSubmit, onCancel }) {
    const [rating, setRating] = useState(initial?.rating || 0);
    const [comment, setComment] = useState(initial?.comment || "");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (!rating) {
            setError("Please choose a star rating.");
            return;
        }
        if (comment.length > MAX) {
            setError(`Review is too long. Keep it under ${MAX} characters.`);
            return;
        }

        setSaving(true);
        try {
            await onSubmit({ rating, comment: comment.trim() });
        } catch (err) {
            setError(getError(err));
            setSaving(false);
        }
    }

    return (
        <form className="card rv-form" onSubmit={handleSubmit} noValidate>
            {error && <div className="alert alert-error" role="alert">{error}</div>}

            <label className="bk-label">Your rating</label>
            <StarInput value={rating} onChange={setRating} />

            <label className="bk-label" htmlFor="rv-comment">Your review (optional)</label>
            <textarea id="rv-comment" className="form-input" rows={4} value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like? How was the stay?" />
            <p className={`char-count ${comment.length > MAX ? "over" : ""}`}>{comment.length}/{MAX}</p>

            <div className="rv-actions">
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                    {saving ? "Saving..." : submitLabel}
                </button>
                {onCancel && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={onCancel} disabled={saving}>
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
}

export default function ReviewsSection({ farmhouseId, onSummary }) {
    const { user } = useAuth();
    const location = useLocation();
    const userId = user?.id;

    const [data, setData] = useState({
        reviews: [], page: 1, pages: 0, total: 0, count: 0, average: 0, distribution: {},
    });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [mine, setMine] = useState({ eligible: false, review: null });
    const [writing, setWriting] = useState(false);
    const [editing, setEditing] = useState(false);

    // logout ke baad purana status nahi dikhna chahiye
    const status = userId ? mine : { eligible: false, review: null };

    const load = useCallback(async () => {
        try {
            const { data: first } = await api.get(`/reviews/farmhouse/${farmhouseId}`, {
                params: { page: 1 },
            });
            setData(first);
            onSummary?.({ average: first.average, count: first.count });
            setError("");
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoading(false);
        }
    }, [farmhouseId, onSummary]);

    const loadMine = useCallback(async () => {
        if (!userId) return;

        try {
            const { data: status } = await api.get(`/reviews/farmhouse/${farmhouseId}/mine`);
            setMine(status);
        } catch {
            setMine({ eligible: false, review: null });
        }
    }, [farmhouseId, userId]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        loadMine();
    }, [loadMine]);

    async function loadMore() {
        setLoadingMore(true);
        try {
            const { data: next } = await api.get(`/reviews/farmhouse/${farmhouseId}`, {
                params: { page: data.page + 1 },
            });
            setData((prev) => ({ ...prev, ...next, reviews: [...prev.reviews, ...next.reviews] }));
        } catch (err) {
            setError(getError(err));
        } finally {
            setLoadingMore(false);
        }
    }

    async function createReview(values) {
        await api.post("/reviews", { farmhouseId, ...values });
        setNotice("Thanks! Your review is published.");
        setWriting(false);
        await Promise.all([load(), loadMine()]);
    }

    async function updateReview(values) {
        await api.put(`/reviews/${status.review._id}`, values);
        setNotice("Your review was updated.");
        setEditing(false);
        await Promise.all([load(), loadMine()]);
    }

    async function removeReview() {
        if (!window.confirm("Delete your review?")) return;

        setError("");
        try {
            await api.delete(`/reviews/${status.review._id}`);
            setNotice("Your review was deleted.");
            await Promise.all([load(), loadMine()]);
        } catch (err) {
            setError(getError(err));
        }
    }

    const myId = status.review?._id;
    const others = data.reviews.filter((r) => r._id !== myId);

    return (
        <section className="reviews" id="reviews">
            <h2>Reviews</h2>

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {notice && <div className="alert alert-success" role="status">{notice}</div>}

            {loading ? (
                <div className="skeleton" style={{ height: 140 }} />
            ) : data.count === 0 ? (
                <p className="muted">No reviews yet. Be the first to share your stay.</p>
            ) : (
                <div className="rv-summary">
                    <div className="rv-score">
                        <b>{data.average.toFixed(1)}</b>
                        <Stars value={data.average} size={20} />
                        <p className="muted">{data.count} review{data.count === 1 ? "" : "s"}</p>
                    </div>

                    <div>
                        {[5, 4, 3, 2, 1].map((n) => {
                            const c = data.distribution?.[n] || 0;
                            const pct = data.count ? (c / data.count) * 100 : 0;

                            return (
                                <div className="dist-row" key={n}>
                                    <span>{n} ★</span>
                                    <div className="dist-bar"><div style={{ width: `${pct}%` }} /></div>
                                    <span className="muted">{c}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ---------- write / edit area ---------- */}
            {!userId && (
                <p className="hint">
                    Stayed here? <Link to="/login" state={{ from: location }}>Log in</Link> to write a review.
                </p>
            )}

            {userId && status.review && !editing && (
                <div className="rv-mine">
                    <strong>Your review</strong>
                    <div style={{ margin: "4px 0" }}><Stars value={status.review.rating} size={16} /></div>
                    {status.review.comment && <p className="rv-text">{status.review.comment}</p>}
                    <div className="rv-actions">
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => { setEditing(true); setNotice(""); }}>
                            Edit
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={removeReview}>Delete</button>
                    </div>
                </div>
            )}

            {userId && status.review && editing && (
                <ReviewForm initial={status.review} submitLabel="Save changes"
                    onSubmit={updateReview} onCancel={() => setEditing(false)} />
            )}

            {userId && !status.review && status.eligible && !writing && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => { setWriting(true); setNotice(""); }}>
                    ✍️ Write a review
                </button>
            )}

            {userId && !status.review && status.eligible && writing && (
                <ReviewForm submitLabel="Publish review" onSubmit={createReview} onCancel={() => setWriting(false)} />
            )}

            {userId && !status.review && !status.eligible && (
                <p className="hint">Only guests with a completed, confirmed stay can leave a review.</p>
            )}

            {/* ---------- list ---------- */}
            {others.map((r) => (
                <div className="review" key={r._id}>
                    <div className="rv-avatar">{(r.user?.name || "G")[0].toUpperCase()}</div>
                    <div>
                        <div className="rv-top">
                            <strong>{shortName(r.user?.name)}</strong>
                            <span className="muted">· {formatDate(r.createdAt)}</span>
                        </div>
                        <Stars value={r.rating} size={14} />
                        {r.comment && <p className="rv-text">{r.comment}</p>}
                    </div>
                </div>
            ))}

            {data.page < data.pages && (
                <div className="center" style={{ marginTop: 16 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore ? "Loading..." : "Show more reviews"}
                    </button>
                </div>
            )}
        </section>
    );
}