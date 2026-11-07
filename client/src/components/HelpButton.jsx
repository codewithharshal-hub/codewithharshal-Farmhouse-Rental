import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SUPPORT, mailHref, phoneHref, whatsappHref } from "../config/support";

export default function HelpButton() {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const { pathname } = useLocation();
    const { user } = useAuth();

    useEffect(() => {
        function onClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        function onKey(e) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    // admin pages pe help button nahi chahiye
    if (["/admin", "/assistant", "/map"].some((p) => pathname.startsWith(p))) return null; const close = () => setOpen(false);

    return (
        <div className="help-fab" ref={ref}>
            {open && (
                <div className="help-pop" role="dialog" aria-label="Help options">
                    <h4>Need help?</h4>

                    <a className="help-link" href={phoneHref} onClick={close}>📞 Call us</a>
                    <a className="help-link" href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={close}>
                        💬 WhatsApp
                    </a>
                    <a className="help-link" href={mailHref} onClick={close}>✉️ Email us</a>

                    {user ? (
                        <Link className="help-link" to="/support/new" onClick={close}>🎫 Raise a ticket</Link>
                    ) : (
                        <Link className="help-link" to="/login" onClick={close}>🎫 Log in to raise a ticket</Link>
                    )}
                    <Link className="help-link" to="/help" onClick={close}>📚 Help center</Link>

                    <p className="help-hours">{SUPPORT.hours}</p>
                </div>
            )}

            <button type="button" className="help-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
                <span aria-hidden="true">{open ? "✕" : "💬"}</span> Help
            </button>
        </div>
    );
}