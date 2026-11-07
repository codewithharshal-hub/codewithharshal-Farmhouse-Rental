import { useState } from "react";

// sirf dikhane ke liye (4.6 jaise decimal bhi chalta hai)
export function Stars({ value = 0, size = 16 }) {
    const pct = (Math.max(0, Math.min(5, value)) / 5) * 100;

    return (
        <span
            className="stars"
            style={{ fontSize: size }}
            role="img"
            aria-label={`${value} out of 5 stars`}
        >
            <span className="stars-bg">★★★★★</span>
            <span className="stars-fg" style={{ width: `${pct}%` }}>★★★★★</span>
        </span>
    );
}

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

// click karke rating chunne ke liye
export function StarInput({ value, onChange }) {
    const [hover, setHover] = useState(0);
    const shown = hover || value;

    return (
        <div className="star-input" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={value === n}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    className={n <= shown ? "on" : ""}
                    onMouseEnter={() => setHover(n)}
                    onClick={() => onChange(n)}
                >
                    ★
                </button>
            ))}
            <span className="star-label">{LABELS[shown]}</span>
        </div>
    );
}