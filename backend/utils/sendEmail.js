import nodemailer from "nodemailer";

export const escapeHtml = (text) =>
    String(text ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    })[c]);

// network errors ka message khaali hota hai, isliye wajah khud nikaalte hain
const reason = (err) => {
    const parts = [
        err?.code,
        err?.message,
        ...(err?.errors || []).map((e) => e.code || e.message),
    ].filter(Boolean);

    return parts.length ? parts.join(" | ") : String(err);
};

let transporterPromise;
let mode = "real"; // real | ethereal | offline

async function createTransporter() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

    // asli SMTP (jaise Gmail ya Brevo) set hai
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
        mode = "real";
        const port = Number(SMTP_PORT) || 465;

        return nodemailer.createTransport({
            host: SMTP_HOST,
            port,
            secure: port === 465,
            auth: { user: SMTP_USER, pass: SMTP_PASS },
        });
    }

    if (process.env.NODE_ENV === "production") {
        throw new Error("SMTP is not configured");
    }

    // development: nakli (Ethereal) test mailbox
    try {
        const account = await nodemailer.createTestAccount();
        mode = "ethereal";

        console.log("[DEV] No SMTP set. Using a free test mailbox (Ethereal).");

        return nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: { user: account.user, pass: account.pass },
        });
    } catch (err) {
        // internet ya firewall rok raha hai: mail nahi bhejenge, par app chalta rahe
        mode = "offline";
        console.log(`[DEV] Could not reach the Ethereal test mailbox (${reason(err)}).`);

        return nodemailer.createTransport({ jsonTransport: true });
    }
}

function getTransporter() {
    if (!transporterPromise) {
        transporterPromise = createTransporter().catch((err) => {
            transporterPromise = undefined; // agli baar dobara koshish
            throw err;
        });
    }
    return transporterPromise;
}

// koi bhi mail bhejne ke liye
export async function sendEmail({ to, subject, text, html }) {
    if (!to) return;

    // development mein mail ka text terminal mein bhi dikha dete hain
    if (process.env.NODE_ENV !== "production") {
        console.log(`\n[DEV] Email to ${to}\nSubject: ${subject}\n${text}\n`);
    }

    const mailer = await getTransporter();

    let info;

    try {
        info = await mailer.sendMail({
            from:
                process.env.MAIL_FROM ||
                process.env.SMTP_USER ||
                '"Farmhouse Rental" <noreply@farmhouse.test>',
            to,
            subject,
            text,
            html,
        });
    } catch (err) {
        throw new Error(reason(err));
    }

    if (mode === "ethereal") {
        console.log(`[DEV] Preview this email: ${nodemailer.getTestMessageUrl(info)}`);
    } else if (mode === "offline") {
        console.log("[DEV] Email not sent (offline mode). The text above is what would have been sent.");
    } else if (process.env.NODE_ENV !== "production") {
        console.log(`Email sent to ${to}`);
    }
}

export async function sendResetEmail({ to, name, link, minutes }) {
    const html = `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;color:#1f2a24">
  <h2 style="color:#256640">Reset your password</h2>
  <p>Hi ${escapeHtml(name)},</p>
  <p>We received a request to reset the password for your Farmhouse Rental account.
     Click the button below to choose a new password. This link works for ${minutes} minutes.</p>
  <p style="margin:24px 0">
    <a href="${link}" style="background:#2f7d4f;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">
      Set a new password
    </a>
  </p>
  <p style="font-size:13px;color:#66726b">If the button does not work, copy this link into your browser:<br>${link}</p>
  <p style="font-size:13px;color:#66726b">If you did not ask for this, you can ignore this email. Your password will stay the same.</p>
</div>`;

    const text = `Hi ${name},

We received a request to reset your Farmhouse Rental password.
Open this link to choose a new one (valid for ${minutes} minutes):

${link}

If you did not ask for this, you can ignore this email.`;

    await sendEmail({
        to,
        subject: "Reset your Farmhouse Rental password",
        text,
        html,
    });
}