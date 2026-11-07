import { useEffect, useRef, useState } from "react";

// screen pe aate hi 0 se value tak ginta hai
export default function CountUp({ value = 0, duration = 1400, prefix = "", suffix = "" }) {
    const ref = useRef(null);
    const [n, setN] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        let frame;
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const run = () => {
            if (reduce || value === 0) {
                setN(value);
                return;
            }

            const start = performance.now();
            const tick = (now) => {
                const t = Math.min((now - start) / duration, 1);
                setN(Math.round(value * (1 - Math.pow(1 - t, 3))));
                if (t < 1) frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
        };

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    run();
                    io.disconnect();
                }
            },
            { threshold: 0.4 }
        );

        io.observe(el);
        return () => {
            io.disconnect();
            cancelAnimationFrame(frame);
        };
    }, [value, duration]);

    return (
        <span ref={ref}>
            {prefix}
            {n.toLocaleString("en-IN")}
            {suffix}
        </span>
    );
}