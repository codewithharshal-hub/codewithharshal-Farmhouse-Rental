import { escapeHtml as esc, sendEmail } from "./sendEmail.js";

const site = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const ref = (id) => `FR-${String(id).slice(-6).toUpperCase()}`;

const day = (d) =>
    new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    });

const nightsOf = (b) =>
    Math.max(1, Math.round((new Date(b.checkOut) - new Date(b.checkIn)) / 86400000));

const telHref = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;

// har value pehle se HTML-safe honi chahiye
const rows = (items) =>
    items
        .filter(([, value]) => value)
        .map(
            ([label, value]) =>
                `<tr><td style="padding:5px 14px 5px 0;color:#66726b;vertical-align:top">${esc(label)}</td>` +
                `<td style="padding:5px 0;font-weight:600">${value}</td></tr>`
        )
        .join("");

const section = (title, items) =>
    `<h3 style="margin:18px 0 4px;font-size:15px">${esc(title)}</h3>` +
    `<table style="border-collapse:collapse;font-size:14px">${rows(items)}</table>`;

const layout = (heading, inner, href, label) => `
<div style="font-family:Arial,sans-serif;max-width:540px;margin:auto;padding:24px;color:#1f2a24">
  <h2 style="color:#256640;margin-top:0">${esc(heading)}</h2>
  ${inner}
  ${
      href
          ? `<p style="margin:24px 0"><a href="${esc(href)}" style="background:#2f7d4f;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">${esc(label)}</a></p>`
          : ""
  }
  <p style="font-size:12px;color:#66726b">Farmhouse Rental</p>
</div>`;

// ---------- host ko: naya booking request ----------
export async function emailNewRequest({ booking, farmhouse, guest, host }) {
    try {
        if (!host?.email) return;

        const nights = nightsOf(booking);

        const html = layout(
            "New booking request",
            `<p>Hi ${esc(host.name)}, ${esc(guest.name)} wants to book <strong>${esc(farmhouse.title)}</strong>.</p>` +
                section("Request", [
                    ["Check-in", esc(day(booking.checkIn))],
                    ["Check-out", esc(day(booking.checkOut))],
                    ["Nights", String(nights)],
                    ["Guests", String(booking.guests)],
                    ["Total", esc(money(booking.totalPrice))],
                ]) +
                section("Guest contact", [
                    ["Name", esc(guest.name)],
                    ["Phone", guest.phone ? `<a href="${esc(telHref(guest.phone))}">${esc(guest.phone)}</a>` : ""],
                    ["Email", esc(guest.email)],
                ]) +
                `<p style="font-size:14px;color:#66726b">Open the request to confirm or reject it.</p>`,
            `${site()}/booking-requests`,
            "View booking requests"
        );

        const text = `Hi ${host.name},

${guest.name} wants to book "${farmhouse.title}".

Check-in: ${day(booking.checkIn)}
Check-out: ${day(booking.checkOut)}
Nights: ${nights}
Guests: ${booking.guests}
Total: ${money(booking.totalPrice)}

Guest: ${guest.name}${guest.phone ? `, ${guest.phone}` : ""}, ${guest.email}

Confirm or reject it here: ${site()}/booking-requests`;

        await sendEmail({
            to: host.email,
            subject: `New booking request: ${farmhouse.title}`,
            text,
            html,
        });
    } catch (err) {
        console.error("New request email failed:", err.message);
    }
}

// ---------- guest ko: booking confirm (poori details, host ka phone, payment) ----------
export async function emailBookingConfirmed({ booking, farmhouse, guest, host }) {
    try {
        if (!guest?.email) return;

        const nights = nightsOf(booking);
        const reference = ref(booking._id);

        const mapUrl =
            farmhouse.latitude != null && farmhouse.longitude != null
                ? `https://www.google.com/maps/search/?api=1&query=${farmhouse.latitude},${farmhouse.longitude}`
                : "";

        const payNote =
            farmhouse.paymentInstructions ||
            "The host has not added payment instructions. Please contact the host to arrange payment.";

        const html = layout(
            "Your booking is confirmed 🎉",
            `<p>Hi ${esc(guest.name)}, ${esc(host.name)} has confirmed your booking.</p>` +
                section("Your stay", [
                    ["Farmhouse", esc(farmhouse.title)],
                    ["Address", esc(farmhouse.location)],
                    ["Map", mapUrl ? `<a href="${esc(mapUrl)}">Open in Google Maps</a>` : ""],
                    ["Check-in", esc(day(booking.checkIn))],
                    ["Check-out", esc(day(booking.checkOut))],
                    ["Nights", String(nights)],
                    ["Guests", String(booking.guests)],
                    ["Reference", esc(reference)],
                ]) +
                section("Host contact", [
                    ["Name", esc(host.name)],
                    ["Phone", host.phone ? `<a href="${esc(telHref(host.phone))}">${esc(host.phone)}</a>` : ""],
                    ["Email", esc(host.email)],
                ]) +
                section("Payment", [
                    ["Total amount", esc(money(booking.totalPrice))],
                    ["Status", "Unpaid"],
                    ["How to pay", `<span style="white-space:pre-wrap">${esc(payNote)}</span>`],
                ]) +
                (farmhouse.arrivalNotes
                    ? section("Arrival notes", [
                          ["From the host", `<span style="white-space:pre-wrap">${esc(farmhouse.arrivalNotes)}</span>`],
                      ])
                    : "") +
                `<p style="font-size:13px;color:#66726b;margin-top:18px">Pay only after the booking is confirmed, and never share OTPs, card PINs or passwords with anyone. Refunds, if any, are arranged directly with the host.</p>`,
            `${site()}/bookings/${booking._id}`,
            "View booking details"
        );

        const text = `Hi ${guest.name},

${host.name} has confirmed your booking. (${reference})

YOUR STAY
Farmhouse: ${farmhouse.title}
Address: ${farmhouse.location}${mapUrl ? `\nMap: ${mapUrl}` : ""}
Check-in: ${day(booking.checkIn)}
Check-out: ${day(booking.checkOut)}
Nights: ${nights}
Guests: ${booking.guests}

HOST CONTACT
Name: ${host.name}
Phone: ${host.phone || "-"}
Email: ${host.email}

PAYMENT
Total amount: ${money(booking.totalPrice)} (unpaid)
How to pay: ${payNote}
${farmhouse.arrivalNotes ? `\nARRIVAL NOTES\n${farmhouse.arrivalNotes}\n` : ""}
View your booking: ${site()}/bookings/${booking._id}

Pay only after the booking is confirmed, and never share OTPs, card PINs or passwords.`;

        await sendEmail({
            to: guest.email,
            subject: `Booking confirmed: ${farmhouse.title} (${reference})`,
            text,
            html,
        });
    } catch (err) {
        console.error("Booking confirmed email failed:", err.message);
    }
}

// ---------- guest ko: request reject ----------
export async function emailBookingRejected({ booking, farmhouse, guest }) {
    try {
        if (!guest?.email) return;

        const html = layout(
            "Booking request not accepted",
            `<p>Hi ${esc(guest.name)}, the host could not accept your request for ` +
                `<strong>${esc(farmhouse.title)}</strong> (${esc(day(booking.checkIn))} to ${esc(day(booking.checkOut))}).</p>` +
                `<p>You can look for another farmhouse or try different dates.</p>`,
            `${site()}/farmhouses`,
            "Browse farmhouses"
        );

        const text = `Hi ${guest.name},

The host could not accept your request for "${farmhouse.title}" (${day(booking.checkIn)} to ${day(booking.checkOut)}).

You can look for another farmhouse here: ${site()}/farmhouses`;

        await sendEmail({
            to: guest.email,
            subject: `Booking request not accepted: ${farmhouse.title}`,
            text,
            html,
        });
    } catch (err) {
        console.error("Booking rejected email failed:", err.message);
    }
}