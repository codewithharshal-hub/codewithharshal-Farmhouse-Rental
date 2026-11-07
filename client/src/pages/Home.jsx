// import { Link } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";

// const steps = [
//     { icon: "🔎", title: "Search", text: "Browse farmhouses by city, price and number of guests." },
//     { icon: "📅", title: "Book", text: "Pick your dates and send a booking request in seconds." },
//     { icon: "🌿", title: "Relax", text: "Enjoy a peaceful stay away from the city noise." },
// ];

// export default function Home() {
//     const { user } = useAuth();

//     return (
//         <>
//             <section className="hero">
//                 <div className="container hero-inner">
//                     <h1>Find your perfect farmhouse getaway</h1>
//                     <p>
//                         Rent a farmhouse for a weekend, or list your own and earn from
//                         your land.
//                     </p>
//                     <div className="hero-actions">
//                         <Link to="/farmhouses" className="btn btn-primary">Browse farmhouses</Link>
//                         <Link to={user ? "/farmhouses" : "/register"} className="btn btn-light">
//                             {user ? "List your farmhouse" : "Become a host"}
//                         </Link>
//                     </div>
//                 </div>
//             </section>

//             <section className="container section">
//                 <h2 className="section-title">How it works</h2>
//                 <div className="grid-3">
//                     {steps.map((s) => (
//                         <div className="card step" key={s.title}>
//                             <div className="step-icon">{s.icon}</div>
//                             <h3>{s.title}</h3>
//                             <p className="muted">{s.text}</p>
//                         </div>
//                     ))}
//                 </div>
//             </section>

//             <section className="container section">
//                 <div className="cta">
//                     <h2>Own a farmhouse?</h2>
//                     <p>List it for free and let travelers find you.</p>
//                     <Link to={user ? "/farmhouses" : "/register"} className="btn btn-light">
//                         {user ? "Go to listings" : "Sign up as a host"}
//                     </Link>
//                 </div>
//             </section>
//         </>
//     );
// }

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import FarmhouseCard from "../components/FarmhouseCard";
import HeroScene from "../components/HeroScene";
import SearchBar from "../components/SearchBar";
import Reveal from "../components/Reveal";
import CountUp from "../components/CountUp";
import Faq from "../components/Faq";

const WORDS = ["weekend escape", "family reunion", "birthday party", "quiet retreat", "friends trip"];

const QUICK = [
    ["✨ Ask AI to find one", "/assistant"],
    ["Under ₹3,000", "/farmhouses?maxPrice=3000&sort=price_asc"],
    ["Groups of 15+", "/farmhouses?guests=15"],
    ["Newest first", "/farmhouses?sort=newest"],
    ["🗺 Browse on map", "/map"],
];

const TILES = [
    { cls: "t1", icon: "🌾", title: "Budget stays", text: "Under ₹3,000 a night", to: "/farmhouses?maxPrice=3000&sort=price_asc" },
    { cls: "t2", icon: "🌳", title: "Mid-range", text: "₹3,000 to ₹7,000 a night", to: "/farmhouses?minPrice=3000&maxPrice=7000" },
    { cls: "t3", icon: "✨", title: "Luxury", text: "₹7,000 and above", to: "/farmhouses?minPrice=7000&sort=price_desc" },
    { cls: "t4", icon: "🎉", title: "Big groups", text: "Space for 15+ guests", to: "/farmhouses?guests=15" },
];

const STEPS = {
    guests: [
        { title: "Search", text: "Filter by location, budget and group size to find the right place." },
        { title: "Request", text: "Pick your dates and send a booking request in a few clicks." },
        { title: "Stay", text: "The host confirms your request, and you enjoy your getaway." },
    ],
    hosts: [
        { title: "Sign up", text: "Create a free account in under a minute." },
        { title: "List", text: "Add details and photos straight from your gallery." },
        { title: "Host", text: "After admin approval guests can send requests. You confirm or reject each one." },
    ],
};

const FEATURES = [
    { icon: "✅", title: "Admin-reviewed listings", text: "Every farmhouse is checked by our admin before it goes live." },
    { icon: "📅", title: "No double bookings", text: "Dates that are already booked cannot be requested again." },
    { icon: "💳", title: "No upfront payment", text: "You only send a request. The host confirms it first." },
    { icon: "📸", title: "Photos from hosts", text: "Hosts upload their own photos, so what you see is what you get." },
];

const FAQS = [
    {
        q: "How do I book a farmhouse?",
        a: "Create a free account, switch to a host account from Become a host, then add your farmhouse details and photos. Once the admin approves it, it goes live. If you change the details later, it is reviewed again.",
    },
    {
        q: "Do I pay online?",
        a: "Not right now. No payment is taken on the platform. You only send a request, and the host confirms it first.",
    },
    {
        q: "Can I cancel a booking?",
        a: "Yes. Open My bookings and cancel a pending or confirmed booking before the check-in date.",
    },
    {
        q: "How do I list my farmhouse?",
        a: "Create a free account, click List farmhouse, and add the details and photos. Once the admin approves it, it goes live. If you change the details later, it is reviewed again.",
    },
    {
        q: "Who can see my phone number and email?",
        a: "Hosts see a guest's name, email and phone only when that guest sends a booking request for their farmhouse.",
    },
    {
        q: "I need help. Who do I contact?",
        a: "Use the Contact page and send us a message. We will reply by email.",
    },
];

export default function Home() {
    const { user } = useAuth();
    const heroRef = useRef(null);

    const [wordIndex, setWordIndex] = useState(0);
    const [tab, setTab] = useState("guests");
    const [latest, setLatest] = useState({ list: [], total: 0 });
    const [loading, setLoading] = useState(true);

    // headline ka shabd badalta rehta hai
    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const id = setInterval(() => setWordIndex((i) => (i + 1) % WORDS.length), 2600);
        return () => clearInterval(id);
    }, []);

    // sabse nayi approved farmhouses
    useEffect(() => {
        let cancelled = false;

        api.get("/farmhouses", { params: { limit: 6, sort: "newest" } })
            .then(({ data }) => {
                if (!cancelled) {
                    setLatest({ list: data.farmhouses || [], total: data.total || 0 });
                }
            })
            .catch(() => { })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, []);

    // mouse ke saath roshni chalti hai
    function onMove(e) {
        const el = heroRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
    }

    const hostLink = user?.role === "host" ? "/farmhouses/new" : "/become-host";
    return (
        <>
            {/* ---------- hero ---------- */}
            <section className="hm-hero" ref={heroRef} onMouseMove={onMove}>
                <div className="hm-sun" aria-hidden="true" />
                <span className="hm-cloud c1" aria-hidden="true" />
                <span className="hm-cloud c2" aria-hidden="true" />
                <span className="hm-cloud c3" aria-hidden="true" />

                <div className="container hm-hero-inner">
                    <span className="hm-badge">🌿 Farmhouses, straight from the hosts</span>

                    <h1 className="hm-title">
                        Find a farmhouse for your next <br />
                        <span key={wordIndex} className="hm-word">{WORDS[wordIndex]}</span>
                    </h1>

                    <p className="hm-sub">
                        Rent a peaceful farmhouse for a weekend, or list your own and let
                        guests find you.
                    </p>

                    <SearchBar />

                    <div className="hm-chips">
                        {QUICK.map(([label, to]) => (
                            <Link key={label} to={to} className="hm-chip">{label}</Link>
                        ))}
                    </div>
                </div>

                <HeroScene />
            </section>

            {/* ---------- stats ---------- */}
            <section className="hm-stats">
                <div className="container">
                    <Reveal>
                        <div className="hm-stats-inner">
                            <div className="hm-stat">
                                <b><CountUp value={latest.total} /></b>
                                <span>Farmhouses live now</span>
                            </div>
                            <div className="hm-stat">
                                <b><CountUp value={100} suffix="%" /></b>
                                <span>Listings reviewed by admin</span>
                            </div>
                            <div className="hm-stat">
                                <b><CountUp value={0} prefix="₹" /></b>
                                <span>Cost to list your farmhouse</span>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* ---------- latest farmhouses ---------- */}
            <section className="container hm-section">
                <Reveal>
                    <div className="hm-head">
                        <div>
                            <span className="hm-eyebrow">Fresh on the platform</span>
                            <h2>Latest farmhouses</h2>
                        </div>
                        <Link to="/farmhouses" className="btn btn-outline btn-sm">View all →</Link>
                    </div>
                </Reveal>

                {loading ? (
                    <div className="fh-grid">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div className="skeleton" key={i} />
                        ))}
                    </div>
                ) : latest.list.length === 0 ? (
                    <div className="empty">
                        <div className="empty-icon">🌾</div>
                        <h3>New farmhouses are on the way</h3>
                        <p className="muted">Be the first host and list yours today.</p>
                        <Link to={hostLink} className="btn btn-primary">List your farmhouse</Link>
                    </div>
                ) : (
                    <div className="fh-grid">
                        {latest.list.map((fh, i) => (
                            <Reveal key={fh._id} delay={i * 70}>
                                <FarmhouseCard farmhouse={fh} />
                            </Reveal>
                        ))}
                    </div>
                )}
            </section>

            {/* ---------- browse by budget ---------- */}
            <section className="container hm-section">
                <Reveal>
                    <div className="hm-head">
                        <div>
                            <span className="hm-eyebrow">Find your fit</span>
                            <h2>Browse by budget and group</h2>
                        </div>
                    </div>
                </Reveal>

                <div className="hm-tiles">
                    {TILES.map((t, i) => (
                        <Reveal key={t.title} delay={i * 80}>
                            <Link to={t.to} className={`hm-tile ${t.cls}`}>
                                <span className="emoji" aria-hidden="true">{t.icon}</span>
                                <h3>{t.title}</h3>
                                <p>{t.text}</p>
                                <span className="go">Explore →</span>
                            </Link>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ---------- how it works ---------- */}
            <section className="container hm-section">
                <Reveal>
                    <div className="center">
                        <span className="hm-eyebrow">Simple and quick</span>
                        <h2 className="hm-h2">How it works</h2>
                    </div>

                    <div className="tabs hm-tabs">
                        <button type="button" className={`tab ${tab === "guests" ? "active" : ""}`}
                            onClick={() => setTab("guests")}>For guests</button>
                        <button type="button" className={`tab ${tab === "hosts" ? "active" : ""}`}
                            onClick={() => setTab("hosts")}>For hosts</button>
                    </div>
                </Reveal>

                <div className="hm-steps" key={tab}>
                    {STEPS[tab].map((s, i) => (
                        <div className="hm-step" key={s.title} style={{ animationDelay: `${i * 90}ms` }}>
                            <span className="hm-num">{i + 1}</span>
                            <h3>{s.title}</h3>
                            <p className="muted">{s.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ---------- why us ---------- */}
            <section className="container hm-section">
                <Reveal>
                    <div className="center">
                        <span className="hm-eyebrow">Why book here</span>
                        <h2 className="hm-h2">Built for a worry-free stay</h2>
                    </div>
                </Reveal>

                <div className="hm-features">
                    {FEATURES.map((f, i) => (
                        <Reveal key={f.title} delay={i * 80}>
                            <div className="hm-feature">
                                <div className="ico">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p className="muted">{f.text}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </section>

            {/* ---------- faq ---------- */}
            <section className="container hm-section">
                <Reveal>
                    <div className="center">
                        <span className="hm-eyebrow">Questions</span>
                        <h2 className="hm-h2">Frequently asked</h2>
                    </div>
                </Reveal>
                <Reveal delay={80}>
                    <Faq items={FAQS} />
                </Reveal>
            </section>

            {/* ---------- host CTA ---------- */}
            <section className="container hm-section hm-last">
                <Reveal>
                    <div className="hm-cta">
                        <h2>Own a farmhouse?</h2>
                        <p>List it for free, add your photos, and start getting booking requests.</p>
                        <Link to={hostLink} className="btn btn-light">
                            {user?.role === "host" ? "List your farmhouse" : "Become a host"}                        </Link>
                    </div>
                </Reveal>
            </section>
        </>
    );
}