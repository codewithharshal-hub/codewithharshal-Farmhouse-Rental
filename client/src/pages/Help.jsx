import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SUPPORT, mailHref, phoneHref, whatsappHref } from "../config/support";
import Faq from "../components/Faq";

const FAQS = [
    {
        q: "My booking is still pending. What should I do?",
        a: "Hosts confirm or reject each request, and you can see the status in My bookings. If it stays pending for a long time, raise a ticket and we will follow up.",
    },
    {
        q: "How do I cancel a booking?",
        a: "Open My bookings and cancel a pending or confirmed booking before the check-in date.",
    },
    {
        q: "My farmhouse is not visible to guests.",
        a: "A listing goes live only after admin approval. Check its status in My listings. A listing you have hidden, or edited recently, is not visible until it is approved again.",
    },
    {
        q: "My account is blocked and I cannot log in.",
        a: "Since you cannot log in, please use the Contact page, call us, or email us, and we will look into it.",
    },
    {
        q: "I forgot my password.",
        a: "Open the login page, click Forgot password, and enter your email. We will send you a link to set a new password. The link works for 30 minutes, so check your spam folder if you do not see it.",
    },
];

export default function Help() {
    const { user } = useAuth();

    const cards = [
        { icon: "📞", title: "Call us", line: SUPPORT.phone, href: phoneHref },
        { icon: "💬", title: "WhatsApp", line: "Chat with us", href: whatsappHref, external: true },
        { icon: "✉️", title: "Email", line: SUPPORT.email, href: mailHref },
    ];

    return (
        <div className="container section">
            <div className="page-head">
                <h1>How can we help?</h1>
                <p className="muted">Reach us in the way that suits you. Support hours: {SUPPORT.hours}.</p>
            </div>

            <div className="sp-cards">
                {cards.map((c) => (
                    <a key={c.title} className="sp-card" href={c.href}
                        {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                        <span className="sp-ico">{c.icon}</span>
                        <strong>{c.title}</strong>
                        <span>{c.line}</span>
                    </a>
                ))}
            </div>

            <div className="sp-cta">
                <div>
                    <h2>Prefer to write it down?</h2>
                    <p>Raise a support ticket and follow our replies right here, like a chat.</p>
                </div>
                <div className="hero-actions">
                    {user ? (
                        <>
                            <Link to="/support/new" className="btn btn-light">Raise a ticket</Link>
                            <Link to="/support" className="btn btn-outline-light">My tickets</Link>
                        </>
                    ) : (
                        <Link to="/login" className="btn btn-light">Log in to raise a ticket</Link>
                    )}
                </div>
            </div>

            <div className="center" style={{ marginTop: 44 }}>
                <span className="hm-eyebrow">Quick answers</span>
                <h2 className="hm-h2">Common questions</h2>
            </div>
            <Faq items={FAQS} />

            <p className="center muted" style={{ marginTop: 28 }}>
                Still stuck? You can also use the <Link to="/contact">Contact page</Link>.
            </p>
        </div>
    );
}