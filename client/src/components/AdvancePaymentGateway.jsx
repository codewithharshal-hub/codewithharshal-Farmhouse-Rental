import { useState, useMemo } from "react";
import { getQrMatrix, matrixToSvgPath } from "../utils/qr";
import { formatPrice, formatDate } from "../utils/format";
import api, { getError } from "../services/api";

export default function AdvancePaymentGateway({ booking, onPaymentSuccess }) {
    const [transactionId, setTransactionId] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState("");
    const [successNotice, setSuccessNotice] = useState("");
    const [showQrModal, setShowQrModal] = useState(true);

    const b = booking;
    const isPaid = b.paymentStatus === "paid";
    const advanceAmount = b.advanceAmount || Math.round(b.totalPrice * 0.3);
    const paidAmount = b.paidAmount || (isPaid ? advanceAmount : 0);
    const remainingAmount = Math.max(0, b.totalPrice - (isPaid ? paidAmount : advanceAmount));
    const advancePct = b.advancePercentage || 30;

    const upiId = b.farmhouse?.upiId || "farmhouserental@upi";
    const payeeName = b.farmhouse?.title || "Farmhouse Rental";
    const bookingRef = b.reference || `FR-${String(b._id).slice(-6).toUpperCase()}`;

    // Standard NPCI UPI URI Scheme
    const upiUri = useMemo(() => {
        const cleanUpi = encodeURIComponent(upiId);
        const cleanName = encodeURIComponent(payeeName.slice(0, 25));
        const cleanNote = encodeURIComponent(`Advance for ${bookingRef}`);
        return `upi://pay?pa=${cleanUpi}&pn=${cleanName}&am=${advanceAmount}&cu=INR&tn=${cleanNote}`;
    }, [upiId, payeeName, advanceAmount, bookingRef]);

    // Generate crisp vector QR Code modules
    const { matrix, size, svgPath } = useMemo(() => {
        const m = getQrMatrix(upiUri, "M");
        if (!m || !m.length) return { matrix: null, size: 0, svgPath: "" };
        return {
            matrix: m,
            size: m.length,
            svgPath: matrixToSvgPath(m),
        };
    }, [upiUri]);

    async function handleCopyUpi() {
        try {
            await navigator.clipboard.writeText(upiId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }

    async function submitPayment(txId) {
        setError("");
        setSuccessNotice("");
        const refToUse = (txId || transactionId).trim();

        if (!refToUse) {
            setError("Please enter the 12-digit UPI Transaction / UTR number or click Instant Demo Pay.");
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await api.put(`/bookings/${b._id}/pay-advance`, {
                transactionId: refToUse,
                paymentMethod: "upi_qr",
                amount: advanceAmount,
            });
            setSuccessNotice(data.message || `Advance payment of ₹${advanceAmount.toLocaleString("en-IN")} confirmed!`);
            if (onPaymentSuccess) {
                onPaymentSuccess(data.booking);
            }
        } catch (err) {
            setError(getError(err));
        } finally {
            setSubmitting(false);
        }
    }

    function handleInstantDemoPay() {
        const demoUtr = `UPI${Date.now().toString().slice(-6)}${Math.floor(1000 + Math.random() * 9000)}`;
        setTransactionId(demoUtr);
        submitPayment(demoUtr);
    }

    // If already paid, display the verified payment receipt card
    if (isPaid) {
        return (
            <div className="card bd-card pay-success-card">
                <div className="pay-success-header">
                    <div className="pay-check-circle">✓</div>
                    <div>
                        <span className="badge confirmed" style={{ fontSize: 13 }}>PAID</span>
                        <h3 style={{ margin: "4px 0 0" }}>Advance Payment Confirmed</h3>
                    </div>
                </div>

                <div className="pay-receipt-grid">
                    <div className="bd-row">
                        <span>Advance Paid</span>
                        <strong className="pay-amount-paid">{formatPrice(paidAmount)}</strong>
                    </div>
                    <div className="bd-row">
                        <span>Remaining at Check-in</span>
                        <strong>{formatPrice(remainingAmount)}</strong>
                    </div>
                    <div className="bd-row">
                        <span>Payment Status</span>
                        <strong style={{ color: "var(--primary)" }}>Paid</strong>
                    </div>
                    <div className="bd-row">
                        <span>Payment Method</span>
                        <strong>UPI QR ({b.paymentMethod || "upi_qr"})</strong>
                    </div>
                    {b.transactionId && (
                        <div className="bd-row">
                            <span>Transaction / UTR ID</span>
                            <code className="pay-tx-code">{b.transactionId}</code>
                        </div>
                    )}
                    {b.paidAt && (
                        <div className="bd-row">
                            <span>Paid On</span>
                            <strong>{formatDate(b.paidAt)}</strong>
                        </div>
                    )}
                </div>

                <div className="pay-success-footer">
                    <p className="hint" style={{ margin: 0 }}>
                        🎉 Your stay is secured! Contact your host below for check-in and arrival arrangements.
                    </p>
                </div>
            </div>
        );
    }

    // Confirmed but Unpaid: Show the dynamic UPI QR Advance Gateway
    return (
        <div className="card bd-card pay-gateway-card">
            <div className="pay-gateway-header">
                <div className="pay-gateway-title">
                    <span className="pay-step-badge">Advance Payment Required</span>
                    <h3 style={{ margin: "4px 0" }}>Scan & Pay Advance via UPI</h3>
                    <p className="muted" style={{ margin: 0, fontSize: 13 }}>
                        Pay ₹{advanceAmount.toLocaleString("en-IN")} ({advancePct}%) now to confirm and lock your booking slot.
                    </p>
                </div>
                <div className="pay-badge-box">
                    <span className="badge pending">Status: Unpaid</span>
                </div>
            </div>

            {error && <div className="alert alert-error" role="alert" style={{ marginTop: 12 }}>{error}</div>}
            {successNotice && <div className="alert alert-success" role="status" style={{ marginTop: 12 }}>{successNotice}</div>}

            <div className="pay-breakdown-bar">
                <div className="pay-break-item">
                    <span className="pay-break-lbl">Total Stay</span>
                    <strong className="pay-break-val">{formatPrice(b.totalPrice)}</strong>
                </div>
                <div className="pay-break-divider">➔</div>
                <div className="pay-break-item highlight">
                    <span className="pay-break-lbl">Advance Due Now ({advancePct}%)</span>
                    <strong className="pay-break-val">{formatPrice(advanceAmount)}</strong>
                </div>
                <div className="pay-break-divider">+</div>
                <div className="pay-break-item">
                    <span className="pay-break-lbl">Payable at Check-in</span>
                    <strong className="pay-break-val">{formatPrice(remainingAmount)}</strong>
                </div>
            </div>

            <div className="pay-qr-container">
                <div className="pay-qr-box">
                    {matrix ? (
                        <div className="pay-qr-svg-wrap">
                            <svg
                                viewBox={`-2 -2 ${size + 4} ${size + 4}`}
                                className="pay-qr-svg"
                                shapeRendering="crispEdges"
                                aria-label="UPI QR Code for Payment"
                            >
                                <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#ffffff" rx="3" />
                                <path d={svgPath} fill="#111827" />
                            </svg>
                        </div>
                    ) : (
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(upiUri)}`}
                            alt="UPI Payment QR Code"
                            className="pay-qr-img"
                        />
                    )}

                    <div className="pay-qr-badges">
                        <span className="upi-app-pill">GPay</span>
                        <span className="upi-app-pill">PhonePe</span>
                        <span className="upi-app-pill">Paytm</span>
                        <span className="upi-app-pill">BHIM</span>
                        <span className="upi-app-pill">Cred</span>
                    </div>
                </div>

                <div className="pay-details-pane">
                    <div className="pay-upi-row">
                        <span className="pay-label">UPI ID</span>
                        <div className="pay-upi-copy-wrap">
                            <code className="pay-upi-id">{upiId}</code>
                            <button
                                type="button"
                                className="btn btn-outline btn-sm copy-btn"
                                onClick={handleCopyUpi}
                            >
                                {copied ? "✓ Copied" : "📋 Copy"}
                            </button>
                        </div>
                    </div>

                    <div className="pay-upi-row">
                        <span className="pay-label">Payee Name</span>
                        <strong>{payeeName}</strong>
                    </div>

                    <div className="pay-upi-row">
                        <span className="pay-label">Amount</span>
                        <strong className="pay-amount-highlight">{formatPrice(advanceAmount)}</strong>
                    </div>

                    <div className="pay-upi-row">
                        <span className="pay-label">Booking Ref</span>
                        <code>{bookingRef}</code>
                    </div>

                    {/* Direct mobile deep-link */}
                    <div className="pay-mobile-action">
                        <a href={upiUri} className="btn btn-outline btn-block btn-sm">
                            📱 Pay via UPI App (GPay / PhonePe / Paytm)
                        </a>
                    </div>
                </div>
            </div>

            {/* Verification Form */}
            <div className="pay-verify-section">
                <h4>Confirm Your Payment</h4>
                <p className="hint" style={{ margin: "0 0 10px" }}>
                    Once you scan the QR and pay ₹{advanceAmount.toLocaleString("en-IN")}, enter the 12-digit UPI Reference / UTR number from your payment receipt to update status to Paid:
                </p>

                <div className="pay-input-row">
                    <input
                        type="text"
                        className="form-input pay-tx-input"
                        placeholder="Enter 12-digit UTR / UPI Ref (e.g. 429381920194)"
                        value={transactionId}
                        onChange={(e) => {
                            setTransactionId(e.target.value);
                            if (error) setError("");
                        }}
                        disabled={submitting}
                    />
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => submitPayment(transactionId)}
                        disabled={submitting || !transactionId.trim()}
                    >
                        {submitting ? "Verifying..." : "✓ Submit Payment"}
                    </button>
                </div>

                <div className="pay-demo-row">
                    <span className="muted" style={{ fontSize: 13 }}>Testing / Demo?</span>
                    <button
                        type="button"
                        className="btn btn-outline btn-sm demo-btn"
                        onClick={handleInstantDemoPay}
                        disabled={submitting}
                        title="Simulate instant successful payment without opening bank app"
                    >
                        ⚡ Instant Pay (Test / Demo Mode)
                    </button>
                </div>
            </div>
        </div>
    );
}

