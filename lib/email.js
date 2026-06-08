/**
 * Email Service — sends emails via Resend (https://resend.com)
 *
 * Swap this module out for SendGrid, Mailgun, etc. if preferred.
 * Just implement sendEmail(to, subject, html) with the same signature.
 *
 * Environment variables:
 *   RESEND_API_KEY  — your Resend API key
 *   EMAIL_FROM      — sender address (e.g. "FANWMG <noreply@fanwmg.com>")
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Moose <moose@yanabear.com>";

/**
 * Sends a single email.
 * @param {string|string[]} to   - Recipient(s)
 * @param {string} subject       - Email subject
 * @param {string} html          - HTML body
 */
async function sendEmail(to, subject, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }

  return res.json();
}

module.exports = { sendEmail };
