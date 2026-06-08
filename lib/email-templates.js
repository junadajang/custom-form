/**
 * Email Template Builders
 *
 * Generates HTML email content from event config + submission data.
 * Two templates:
 *   1. Internal notification (sent to macaela@ and info@)
 *   2. Guest confirmation (sent to each attendee email)
 */

/**
 * Builds the internal notification email HTML.
 *
 * @param {Object} event     — Event config from config/events.js
 * @param {Object} data      — Submission payload { registrant, guests, totalAttendees, submittedAt }
 * @returns {string} HTML
 */
function buildInternalEmail(event, data) {
  const loc = event.location;
  const reg = data.registrant;

  let guestRows = "";
  if (data.guests && data.guests.length > 0) {
    guestRows = data.guests
      .map(function (g, i) {
        return `
        <tr>
          <td style="padding:6px 12px;border:1px solid #ddd;">${i + 2}</td>
          <td style="padding:6px 12px;border:1px solid #ddd;">${esc(g.firstName)} ${esc(g.lastName)}</td>
          <td style="padding:6px 12px;border:1px solid #ddd;">${esc(g.email)}</td>
          <td style="padding:6px 12px;border:1px solid #ddd;">${esc(g.phone)}</td>
          <td style="padding:6px 12px;border:1px solid #ddd;">${esc(g.address)}</td>
        </tr>`;
      })
      .join("");
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;line-height:1.6;max-width:600px;margin:0 auto;padding:20px;">
  <h2 style="color:#1e2d3d;border-bottom:2px solid #990303;padding-bottom:10px;">
    New Registration: ${esc(event.eventName)}
  </h2>

  <p><strong>Submitted:</strong> ${new Date(data.submittedAt).toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}</p>
  <p><strong>Total Attendees:</strong> ${data.totalAttendees}</p>

  <h3 style="color:#1e2d3d;margin-top:24px;">Primary Registrant</h3>
  <table style="border-collapse:collapse;width:100%;">
    <tr><td style="padding:6px 12px;font-weight:bold;width:140px;">Name</td><td style="padding:6px 12px;">${esc(reg.firstName)} ${esc(reg.lastName)}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:bold;">Email</td><td style="padding:6px 12px;">${esc(reg.email)}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:bold;">Phone</td><td style="padding:6px 12px;">${esc(reg.phone)}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:bold;">Address</td><td style="padding:6px 12px;">${esc(reg.address)}</td></tr>
    <tr><td style="padding:6px 12px;font-weight:bold;">Referral</td><td style="padding:6px 12px;">${esc(reg.referral)}</td></tr>
  </table>

  ${
    data.guests.length > 0
      ? `
  <h3 style="color:#1e2d3d;margin-top:24px;">Guests</h3>
  <table style="border-collapse:collapse;width:100%;">
    <tr style="background:#f5f5f5;">
      <th style="padding:8px 12px;border:1px solid #ddd;text-align:left;">#</th>
      <th style="padding:8px 12px;border:1px solid #ddd;text-align:left;">Name</th>
      <th style="padding:8px 12px;border:1px solid #ddd;text-align:left;">Email</th>
      <th style="padding:8px 12px;border:1px solid #ddd;text-align:left;">Phone</th>
      <th style="padding:8px 12px;border:1px solid #ddd;text-align:left;">Address</th>
    </tr>
    ${guestRows}
  </table>`
      : ""
  }

  <hr style="margin-top:30px;border:none;border-top:1px solid #ddd;">
  <p style="font-size:12px;color:#999;">This is an automated notification from the ${esc(event.eventName)} registration form.</p>
</body>
</html>`;
}

/**
 * Builds the guest confirmation email HTML.
 *
 * @param {Object} event       — Event config from config/events.js
 * @param {string} guestName   — The guest's full name
 * @returns {string} HTML
 */
function buildGuestConfirmationEmail(event, guestName) {
  const loc = event.location;

  const dateRows = event.eventDates
    .map(function (d) {
      return `<li><strong>${esc(d.label)}:</strong> ${esc(d.day)} - ${esc(d.room)}${d.note ? " – " + esc(d.note) : ""}</li>`;
    })
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;line-height:1.7;max-width:600px;margin:0 auto;padding:20px;">
  <h2 style="color:#1e2d3d;">${esc(event.eventName)}</h2>
  <p>${esc(event.eventSubtitle)}</p>

  <p>Hello ${esc(guestName)},</p>
  <p>Thank you for registering! Here are your event details:</p>

  <h3 style="color:#1e2d3d;margin-top:20px;">Event Information</h3>
  <p><strong>Presenter:</strong> ${esc(event.presenters)}</p>
  <ul style="padding-left:20px;">${dateRows}</ul>
  <p><strong>Time:</strong> ${esc(event.time)}</p>

  <h3 style="color:#1e2d3d;margin-top:20px;">Location</h3>
  <p>
    ${esc(loc.name)}<br>
    ${esc(loc.address)}, Room: ${esc(loc.room)}<br>
    ${esc(loc.city)}, ${esc(loc.state)}, ${esc(loc.zip)}, ${esc(loc.country)}
  </p>

  <p style="margin-top:24px;">We look forward to seeing you there!</p>

  <hr style="margin-top:30px;border:none;border-top:1px solid #ddd;">
  <p style="font-size:12px;color:#999;">If you did not register for this event, please disregard this email.</p>
</body>
</html>`;
}

/** Escapes HTML special characters to prevent injection in emails. */
function esc(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { buildInternalEmail, buildGuestConfirmationEmail };
