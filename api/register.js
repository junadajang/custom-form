/**
 * POST /api/register
 *
 * Vercel Serverless Function — handles registration form submissions.
 *
 * Responsibilities:
 *   1. Validate + sanitize incoming data
 *   2. Send internal notification email to team
 *   3. Send confirmation email to each attendee
 *   4. Create/update contacts in Constant Contact
 *
 * Environment Variables (set in Vercel dashboard):
 *   RESEND_API_KEY       — Resend email API key
 *   EMAIL_FROM           — Sender address (e.g. "FANWMG <noreply@fanwmg.com>")
 *   CC_API_KEY           — Constant Contact API key
 *   CC_LIST_ID_APR_MV    — Constant Contact list ID for APR MV event
 *   (add more CC_LIST_ID_* vars per event)
 */

const { getEventConfig } = require("../config/events");
const { sendEmail } = require("../lib/email");
const { upsertContact } = require("../lib/constant-contact");
const {
  buildInternalEmail,
  buildGuestConfirmationEmail,
} = require("../lib/email-templates");

/* ────────────────────────────────────────
   Validation helpers
   ──────────────────────────────────────── */

function isNonEmpty(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function isValidPhone(v) {
  return typeof v === "string" && v.replace(/\D/g, "").length === 10;
}

/** Sanitize a string: trim and limit length. */
function clean(v, maxLen) {
  if (typeof v !== "string") return "";
  return v.trim().substring(0, maxLen || 200);
}

/** Validates the full payload. Returns an error string or null. */
function validatePayload(body) {
  if (!body || typeof body !== "object") return "Invalid request body.";
  if (!isNonEmpty(body.eventId)) return "Missing eventId.";

  const r = body.registrant;
  if (!r || typeof r !== "object") return "Missing registrant data.";
  if (!isNonEmpty(r.firstName)) return "First name is required.";
  if (!isNonEmpty(r.lastName)) return "Last name is required.";
  if (!isValidEmail(r.email)) return "Please enter a valid email address.";
  if (!isValidPhone(r.phone)) return "Please enter a valid phone number.";
  if (!isNonEmpty(r.address)) return "Address is required.";
  if (!isNonEmpty(r.referral)) return "Referral name is required.";

  if (!Array.isArray(body.guests)) return "Guests must be an array.";
  if (body.guests.length > 4) return "Maximum of 4 additional guests.";

  for (let i = 0; i < body.guests.length; i++) {
    const g = body.guests[i];
    if (!g || typeof g !== "object") return `Guest ${i + 1}: invalid data.`;
    if (!isNonEmpty(g.firstName)) return `Guest ${i + 1}: first name is required.`;
    if (!isNonEmpty(g.lastName)) return `Guest ${i + 1}: last name is required.`;
    if (!isValidEmail(g.email)) return `Guest ${i + 1}: valid email is required.`;
    if (!isValidPhone(g.phone)) return `Guest ${i + 1}: valid phone number is required.`;
    if (!isNonEmpty(g.address)) return `Guest ${i + 1}: address is required.`;
  }

  return null;
}

/* ────────────────────────────────────────
   Handler
   ──────────────────────────────────────── */

module.exports = async function handler(req, res) {
  // CORS headers for Webflow embed
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  try {
    const body = req.body;

    // 1. Validate
    const validationError = validatePayload(body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // 2. Load event config
    let event;
    try {
      event = getEventConfig(clean(body.eventId, 100));
    } catch (e) {
      return res.status(400).json({ error: e.message });
    }

    // 3. Sanitize data
    const registrant = {
      firstName: clean(body.registrant.firstName, 100),
      lastName: clean(body.registrant.lastName, 100),
      email: clean(body.registrant.email, 200).toLowerCase(),
      phone: clean(body.registrant.phone, 30),
      address: clean(body.registrant.address, 300),
      referral: clean(body.registrant.referral, 200),
    };

    const guests = body.guests.map(function (g) {
      return {
        firstName: clean(g.firstName, 100),
        lastName: clean(g.lastName, 100),
        email: clean(g.email, 200).toLowerCase(),
        phone: clean(g.phone, 30),
        address: clean(g.address, 300),
      };
    });

    const sanitized = {
      eventId: body.eventId,
      registrant,
      guests,
      totalAttendees: 1 + guests.length,
      submittedAt: body.submittedAt || new Date().toISOString(),
    };

    // ─── STEP 1: STORE AT CONSTANT CONTACT ───
    // Save registrant + all guests as contacts (with list + tags)
    // This runs FIRST so data is persisted before emails go out.
    const ccPromises = [];

    ccPromises.push(
      upsertContact({
        email: registrant.email,
        firstName: registrant.firstName,
        lastName: registrant.lastName,
        phone: registrant.phone,
        address: registrant.address,
        listId: event.constantContactListId,
        tags: event.tags,
      })
    );

    guests.forEach(function (g) {
      ccPromises.push(
        upsertContact({
          email: g.email,
          firstName: g.firstName,
          lastName: g.lastName,
          phone: g.phone,
          address: g.address,
          listId: event.constantContactListId,
          tags: event.tags,
        })
      );
    });

    try {
      await Promise.all(ccPromises);
    } catch (ccErr) {
      console.error("Constant Contact error (non-blocking):", ccErr.message);
    }

    // ─── STEP 2: SEND INTERNAL NOTIFICATION (via Resend) ───
    // Notify macaela@fanwmg.com + info@fanwmg.com with full details
    const internalHtml = buildInternalEmail(event, sanitized);
    await sendEmail(
      event.internalRecipients,
      `New Registration: ${event.eventName} (${sanitized.totalAttendees} attendee${sanitized.totalAttendees > 1 ? "s" : ""})`,
      internalHtml
    );

    // ─── STEP 3: SEND CONFIRMATION EMAILS (via Resend) ───
    // Each attendee (registrant + guests) gets event details email
    const allAttendees = [
      { name: `${registrant.firstName} ${registrant.lastName}`, email: registrant.email },
      ...guests.map(function (g) {
        return { name: `${g.firstName} ${g.lastName}`, email: g.email };
      }),
    ];

    // Deduplicate by email
    const seen = new Set();
    const uniqueAttendees = allAttendees.filter(function (a) {
      const key = a.email.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const confirmationPromises = uniqueAttendees.map(function (attendee) {
      const html = buildGuestConfirmationEmail(event, attendee.name);
      return sendEmail(
        attendee.email,
        `Registration Confirmed: ${event.eventName}`,
        html
      );
    });

    await Promise.all(confirmationPromises);

    // 7. Respond success
    return res.status(200).json({
      success: true,
      message: "Registration complete.",
      totalAttendees: sanitized.totalAttendees,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({
      error: "An unexpected error occurred. Please try again later.",
    });
  }
};
