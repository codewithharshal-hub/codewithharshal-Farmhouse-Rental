import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api, { getError } from "../services/api";
import FarmhouseCard from "../components/FarmhouseCard";
import { formatPrice } from "../utils/format";

const MAX = 300;

const EXAMPLES = [
    "Farmhouse for 10 people near Pune under ₹5,000",
    "Pool and parking, 4 bedrooms",
    "Cheapest place for a weekend with 6 guests",
    "Top rated farmhouse for a birthday party",
];

const SORT_LABEL = {
    newest: "Newest first",
    price_asc: "Lowest price",
    price_desc: "Highest price",
    rating: "Top rated",
};

// AI ne jo samjha use chhote chips mein dikhata hai
function filterChips(f) {
    const chips = [];

    if (f.search) chips.push(`📍 ${f.search}`);
    if (f.guests) chips.push(`👥 ${f.guests}+ guests`);
    if (f.bedrooms) chips.push(`🛏 ${f.bedrooms}+ bedrooms`);

    if (f.minPrice !== null && f.minPrice > 0 && f.maxPrice !== null) {
        chips.push(`💰 ${formatPrice(f.minPrice)} to ${formatPrice(f.maxPrice)}`);
    } else if (f.maxPrice !== null) {
        chips.push(`💰 up to ${formatPrice(f.maxPrice)}`);
    } else if (f.minPrice !== null && f.minPrice > 0) {
        chips.push(`💰 from ${formatPrice(f.minPrice)}`);
    }

    (f.amenities || []).forEach((a) => chips.push(`✓ ${a}`));
    if (f.sort) chips.push(`↕ ${SORT_LABEL[f.sort]}`);

    return chips;
}

// "Sab dekho" ke liye Farmhouses page ka link
function listLink(f) {
    const params = new URLSearchParams();

    if (f.search) params.set("search", f.search);
    if (f.guests) params.set("guests", f.guests);
    if (f.minPrice !== null && f.minPrice > 0) params.set("minPrice", f.minPrice);
    if (f.maxPrice !== null) params.set("maxPrice", f.maxPrice);
    if (f.sort) params.set("sort", f.sort);

    const query = params.toString();
    return query ? `/farmhouses?${query}` : "/farmhouses";
}

function BotMessage({ m }) {
    const d = m.data;

    if (!d) {
        return <div className={`ai-bubble ${m.error ? "error" : ""}`}>{m.text}</div>;
    }

    const chips = d.intent === "search" ? filterChips(d.filters) : [];
    const shown = d.farmhouses.length;

    return (
        <>
            <div className="ai-bubble">{m.text}</div>

            {chips.length > 0 && (
                <div className="ai-chips">
                    {chips.map((c) => (
                        <span className="ai-chip" key={c}>{c}</span>
                    ))}
                </div>
            )}

            {d.intent === "search" && d.relaxed.length > 0 && d.total > 0 && (
                <p className="hint">
                    No exact match for your {d.relaxed.join(" and ")} request, so these are the closest options without it.
                </p>
            )}

            {d.intent === "search" && d.total === 0 && (
                <p className="muted ai-count">
                    No farmhouses match yet. Try a higher budget or fewer guests.
                </p>
            )}

            {d.total > 0 && (
                <>
                    <p className="muted ai-count">
                        {d.total} farmhouse{d.total === 1 ? "" : "s"} found
                        {d.total > shown ? `, showing the top ${shown}` : ""}
                    </p>

                    <div className="ai-results">
                        {d.farmhouses.map((fh) => (
                            <FarmhouseCard key={fh._id} farmhouse={fh} />
                        ))}
                    </div>

                    {d.total > shown && (
                        <p style={{ marginTop: 12 }}>
                            <Link to={listLink(d.applied)} className="btn btn-outline btn-sm">
                                See all {d.total} on the Farmhouses page →
                            </Link>
                        </p>
                    )}
                </>
            )}

            {!d.usedAI && (
                <p className="hint">The AI is busy right now, so I used a simple keyword search.</p>
            )}
        </>
    );
}

export default function Assistant() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [previous, setPrevious] = useState(null);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }
    }, [messages, loading]);

    async function send(text) {
        const message = (text ?? input).trim();
        if (!message || loading) return;

        setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: "user", text: message }]);
        setInput("");
        setLoading(true);

        try {
            const { data } = await api.post("/assistant", { message, previous });

            setPrevious(data.filters || null);
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "bot", text: data.reply, data },
            ]);
        } catch (err) {
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "bot", error: true, text: getError(err) },
            ]);
        } finally {
            setLoading(false);
        }
    }

    function handleSubmit(e) {
        e.preventDefault();
        send();
    }

    function onKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
        }
    }

    function clearChat() {
        setMessages([]);
        setPrevious(null);
    }

    return (
        <div className="container section">
            <div className="ai-page">
                <div className="ai-hero">
                    <h1>✨ Find your farmhouse with AI</h1>
                    <p className="muted">
                        Describe what you want in your own words. English, Hindi or Hinglish, all work.
                    </p>

                    {messages.length === 0 && (
                        <div className="ai-prompts">
                            {EXAMPLES.map((ex) => (
                                <button key={ex} type="button" className="ai-prompt" onClick={() => send(ex)} disabled={loading}>
                                    {ex}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="ai-thread">
                    {messages.map((m) => (
                        <div className={`ai-row ${m.role}`} key={m.id}>
                            <div className={`ai-avatar ${m.role === "bot" ? "bot" : "me"}`}>
                                {m.role === "bot" ? "✦" : "Y"}
                            </div>
                            <div className="ai-body">
                                {m.role === "bot" ? <BotMessage m={m} /> : <div className="ai-bubble">{m.text}</div>}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="ai-row bot">
                            <div className="ai-avatar bot">✦</div>
                            <div className="ai-body">
                                <div className="ai-bubble">
                                    <div className="ai-typing" aria-label="The assistant is thinking">
                                        <span /><span /><span />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={bottomRef} />
                </div>

                <form className="ai-composer" onSubmit={handleSubmit}>
                    <textarea
                        rows={1}
                        value={input}
                        maxLength={MAX}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="e.g. 10 logo ke liye Pune ke paas 5000 ke andar, pool ke saath"
                        aria-label="Describe the farmhouse you want"
                        disabled={loading}
                    />
                    <button type="submit" className="ai-send" disabled={loading || !input.trim()} aria-label="Send">
                        ➤
                    </button>
                </form>

                <div className="ai-foot">
                    <span>
                        {messages.length > 0 && (
                            <button type="button" className="link-btn" onClick={clearChat}>Start over</button>
                        )}
                    </span>
                    <span>{input.length}/{MAX}</span>
                </div>
            </div>
        </div>
    );
}