/**
 * Constant Contact Integration
 *
 * Uses Constant Contact V3 API to create/update contacts
 * and assign them to lists + tags.
 *
 * Token management is handled by lib/cc-auth.js which
 * auto-refreshes using the long-lived refresh token.
 *
 * Docs: https://developer.constantcontact.com/api_reference/index.html
 */

const { getAccessToken } = require("./cc-auth");
const CC_API_BASE = "https://api.cc.email/v3";

/**
 * Creates or updates a contact in Constant Contact.
 *
 * Uses the "create_or_update" action so existing contacts
 * (matched by email) get updated rather than duplicated.
 *
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.firstName
 * @param {string} params.lastName
 * @param {string} [params.phone]
 * @param {string} [params.address]
 * @param {string} params.listId       — Constant Contact list UUID
 * @param {string[]} [params.tags]     — Tag names to apply
 */
async function upsertContact({
  email,
  firstName,
  lastName,
  phone,
  address,
  listId,
  tags,
}) {
  const contactBody = {
    email_address: email,
    first_name: firstName,
    last_name: lastName,
    list_memberships: listId ? [listId] : [],
  };

  const accessToken = await getAccessToken();

  const res = await fetch(`${CC_API_BASE}/contacts/sign_up_form`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(contactBody),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Constant Contact API error (${res.status}): ${body}`);
  }

  return res.json();
}

module.exports = { upsertContact };
