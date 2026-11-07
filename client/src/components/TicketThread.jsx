import { useEffect, useRef, useState } from "react";
import { getError } from "../services/api";
import { formatDateTime } from "../utils/tickets";

const MAX = 2000;

export default function TicketThread({ messages, viewer, onSend, resolved }) {
    const [text, setText] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState("");
    const boxRef = useRef(null);

    // naya message aane par neeche scroll
    useEffect(() => {
        const el = boxRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages.length]);

    const otherName = viewer === "admin" ? "Customer" : "Support team";

    async function handleSend(e) {
        e.preventDefault();
        setError("");

        const value = text.trim();

        if (!value) {
            setError("Please type a message.");
            return;
        }
        if (value.length > MAX) {
            setError(`Message is too long. Keep it under ${MAX} characters.`);
            return;
        }

        setSending(true);
        try {
            await onSend(value);
            setText("");
        } catch (err) {
            setError(getError(err));
        } finally {
            setSending(false);
        }
    }

    return (
        <>
            <div className="thread" ref={boxRef}>
                {messages.map((m) => {
                    const mine = m.sender === viewer;

                    return (
                        <div className={`msg ${mine ? "mine" : "theirs"}`} key={m._id}>
                            <div className="msg-meta">
                                {mine ? "You" : otherName} · {formatDateTime(m.createdAt)}
                            </div>
                            <div className="msg-bubble">{m.text}</div>
                        </div>
                    );
                })}
            </div>

            <form className="reply-form" onSubmit={handleSend} noValidate>
                <textarea className="form-input" rows={3} value={text}
                    onChange={(e) => { setText(e.target.value); if (error) setError(""); }}
                    placeholder={viewer === "admin" ? "Write a reply to the customer..." : "Write your reply..."}
                    aria-label="Your message" />

                {error && <div className="alert alert-error" role="alert">{error}</div>}

                <div className="reply-actions">
                    <span className={`char-count ${text.length > MAX ? "over" : ""}`}>
                        {text.length}/{MAX}
                    </span>
                    <button type="submit" className="btn btn-primary btn-sm" disabled={sending}>
                        {sending ? "Sending..." : "Send"}
                    </button>
                </div>

                {resolved && (
                    <p className="hint">This ticket is resolved. Sending a message will reopen it.</p>
                )}
            </form>
        </>
    );
}