import { useEffect, useRef, useState } from "react";

// scroll karne par dheere se upar aata hai
export default function Reveal({ children, delay = 0, className = "" }) {
    const ref = useRef(null);
    const [shown, setShown] = useState(() => !("IntersectionObserver" in window));

    useEffect(() => {
        const el = ref.current;
        if (!el || shown) return;

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true);
                    io.disconnect();
                }
            },
            { threshold: 0.15 }
        );

        io.observe(el);
        return () => io.disconnect();
    }, [shown]);

    return (
        <div
            ref={ref}
            className={`reveal ${shown ? "in" : ""} ${className}`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            {children}
        </div>
    );
}