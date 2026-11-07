import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api, { getError } from "../services/api";
import MapView from "../components/MapView";
import AdvancePaymentGateway from "../components/AdvancePaymentGateway";
import { formatDate, formatPrice, telLink, whatsappLink } from "../utils/format";

const GUEST_NOTE = {
    pending: "⏳ Waiting for the host to confirm. Once confirmed, you can pay the advance amount via QR code here.",
    confirmed_unpaid: "✅ Booking confirmed by host! Please scan the QR code below to pay the advance and guarantee your stay.",
    confirmed_paid: "🎉 Advance payment received! Your reservation is secured. Contact your host to coordinate arrival.",
    rejected: "⛔ The host could not accept this request. You can look for another farmhouse.",
    cancelled: "❌ This booking was cancelled.",
};

function ContactCard({ title, person, hint }) {
    return (
        <div className="card bd-card">
            <h3>{title}</h3>
            <p className="bd-name">{person.name}</p>

            {person.phone ? (
                <div className="bd-contact">
                    <a href={telLink(person.phone)} className="btn btn-primary btn-sm">📞 Call {person.phone}</a>
                    <a href={whatsappLink(person.phone)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                        💬 WhatsApp
                    </a>
                </div>
            ) : (
                <p className="muted">No phone number added.</p>
            )}

            {person.email && (
                <p className="bk-line">✉️ <a href={`mailto:${person.email}`}>{person.email}</a></p>
            )}
            {hint && <p className="hint">{hint}</p>}
        </div>
    );
}

export default function BookingDetails() {
    const { id } = useParams();
    const [b, setB] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const { data } = await api.get(`/bookings/${id}`);
                if (!cancelled) {
                    setB(data);
                    setError("");
                }
            } catch (err) {
                if (!cancelled) setError(getError(err));
            } finally {
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [id, reload]);

    const mapItems = useMemo(
        () => (b?.farmhouse?.latitude != null ? [b.farmhouse] : []),
        [b]
    );

    async function setPaid(paid) {
        setBusy(true);
        setError("");
        setNotice("");
        try {
            await api.put(`/bookings/${id}/payment`, { paid });
            setNotice(paid ? "Marked as paid. The guest has been notified." : "Marked as unpaid.");
            setReload((r) => r + 1);
        } catch (err) {
            setError(getError(err));
        } finally {
            setBusy(false);
        }
    }

    if (loading) {
        return (
            <div className="container section narrow">
                <div className="skeleton" style={{ height: 320 }} />
            </div>
        );
    }

    if (!b) {
        return (
            <div className="container section center">
                <h2>{error || "Booking not found"}</h2>
                <Link to="/my-bookings" className="btn btn-primary">Back to my bookings</Link>
            </div>
        );
    }

    const isHost = b.viewerRole === "host";
    const confirmed = b.status === "confirmed";
    const f = b.farmhouse;
    const spot = f && f.latitude != null ? `${f.latitude},${f.longitude}` : "";

    return (
        <div className="container section narrow">
            <Link to={isHost ? "/booking-requests" : "/my-bookings"} className="back-link no-print">
                ← Back
            </Link>

            <div className="head-row">
                <div>
                    <p className="muted" style={{ margin: 0 }}>Booking {b.reference}</p>
                    <h1 style={{ marginTop: 4 }}>{f ? f.title : "Farmhouse no longer available"}</h1>
                    {f && <p className="muted" style={{ margin: 0 }}>📍 {f.location}</p>}
                </div>
                <span className={`badge ${b.status}`}>{b.status}</span>
            </div>

            {error && <div className="alert alert-error" role="alert">{error}</div>}
            {notice && <div className="alert alert-success" role="status">{notice}</div>}

            {!isHost && (
                <div className="bd-banner">
                    {confirmed
                        ? b.paymentStatus === "paid"
                            ? GUEST_NOTE.confirmed_paid
                            : GUEST_NOTE.confirmed_unpaid
                        : GUEST_NOTE[b.status]}
                </div>
            )}

            <div className="bd-grid">
                <div className="card bd-card">
                    <h3>Stay</h3>
                    <div className="bd-row"><span>Check-in</span><strong>{formatDate(b.checkIn)}</strong></div>
                    <div className="bd-row"><span>Check-out</span><strong>{formatDate(b.checkOut)}</strong></div>
                    <div className="bd-row"><span>Nights</span><strong>{b.nights}</strong></div>
                    <div className="bd-row"><span>Guests</span><strong>{b.guests}</strong></div>
                </div>

                <div className="card bd-card">
                    <h3>Payment</h3>
                    <div className="bd-row"><span>Total amount</span><strong>{formatPrice(b.totalPrice)}</strong></div>
                    <div className="bd-row">
                        <span>Advance ({b.advancePercentage || 30}%)</span>
                        <strong>{formatPrice(b.advanceAmount || Math.round(b.totalPrice * 0.3))}</strong>
                    </div>
                    <div className="bd-row">
                        <span>Status</span>
                        <span className={`badge ${b.paymentStatus === "paid" ? "confirmed" : "pending"}`}>
                            {b.paymentStatus === "paid"
                                ? `Paid (${formatPrice(b.paidAmount || b.advanceAmount || Math.round(b.totalPrice * 0.3))})`
                                : "Unpaid"}
                        </span>
                    </div>
                    {b.paymentStatus === "paid" && (
                        <div className="bd-row">
                            <span>Balance at check-in</span>
                            <strong>
                                {formatPrice(
                                    b.remainingAmount != null
                                        ? b.remainingAmount
                                        : Math.max(0, b.totalPrice - (b.paidAmount || b.advanceAmount || Math.round(b.totalPrice * 0.3)))
                                )}
                            </strong>
                        </div>
                    )}
                    {b.transactionId && (
                        <div className="bd-row">
                            <span>Ref / UTR</span>
                            <code style={{ fontSize: 12 }}>{b.transactionId}</code>
                        </div>
                    )}
                    {b.paidAt && <p className="hint">Paid on {formatDate(b.paidAt)}</p>}

                    {isHost && confirmed && (
                        <div style={{ marginTop: 10 }}>
                            <button type="button" className="btn btn-outline btn-sm no-print" disabled={busy}
                                onClick={() => setPaid(b.paymentStatus !== "paid")}>
                                {b.paymentStatus === "paid" ? "Mark as unpaid" : "✓ Mark payment received"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ---------- guest ke liye Advance Payment QR Gateway (confirm hone ke baad) ---------- */}
            {!isHost && confirmed && (
                <AdvancePaymentGateway
                    booking={b}
                    onPaymentSuccess={(updated) => {
                        setB((prev) => ({ ...prev, ...updated }));
                        setNotice("Advance payment verified successfully! Your booking is secured.");
                    }}
                />
            )}

            {/* ---------- guest ke liye (confirm hone ke baad) ---------- */}
            {!isHost && confirmed && (
                <>
                    {b.host && (
                        <ContactCard title="Your host" person={b.host}
                            hint="Call or message the host to confirm your arrival time." />
                    )}

                    <div className="card bd-card">
                        <h3>How to pay</h3>
                        <p className="bd-text">
                            {b.paymentInstructions ||
                                "The host has not added payment instructions. Please contact the host to arrange payment."}
                        </p>
                        <p className="hint">
                            Pay only after the booking is confirmed, and never share OTPs, card PINs or passwords with anyone.
                            Refunds, if any, are arranged directly with the host.
                        </p>
                    </div>

                    {b.arrivalNotes && (
                        <div className="card bd-card">
                            <h3>Arrival notes from the host</h3>
                            <p className="bd-text">{b.arrivalNotes}</p>
                        </div>
                    )}
                </>
            )}

            {/* ---------- host ke liye ---------- */}
            {isHost && b.guest && (
                <ContactCard title="Guest" person={b.guest} />
            )}

            {f && spot && (
                <div className="card bd-card">
                    <h3>Location</h3>
                    <div className="loc-map">
                        <MapView farmhouses={mapItems} single height="100%" />
                    </div>
                    <div className="loc-links no-print">
                        <a className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer"
                            href={`https://www.google.com/maps/search/?api=1&query=${spot}`}>
                            Open in Google Maps
                        </a>
                        <a className="btn btn-outline btn-sm" target="_blank" rel="noopener noreferrer"
                            href={`https://www.google.com/maps/dir/?api=1&destination=${spot}`}>
                            Get directions
                        </a>
                    </div>
                </div>
            )}

            <div className="bd-actions no-print">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => window.print()}>
                    🖨 Print or save as PDF
                </button>
                {f && <Link to={`/farmhouses/${f._id}`} className="btn btn-outline btn-sm">View farmhouse</Link>}
            </div>
        </div>
    );
}