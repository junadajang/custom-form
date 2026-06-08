# FANWMG Registration Form — Setup & Deployment Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  WEBFLOW PAGE                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │  Custom Code Embed                            │  │
│  │  registration-form.html (HTML + CSS + JS)     │  │
│  │                                               │  │
│  │  On submit → POST /api/register               │  │
│  └───────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS POST (JSON)
                    ▼
┌─────────────────────────────────────────────────────┐
│  VERCEL SERVERLESS BACKEND                          │
│                                                     │
│  api/register.js                                    │
│  ├── Validates + sanitizes payload                  │
│  ├── Loads event config (config/events.js)          │
│  ├── Sends internal email → macaela@ + info@        │
│  ├── Sends confirmation email → each attendee       │
│  └── Creates contacts → Constant Contact API        │
│                                                     │
│  lib/email.js              → Resend API             │
│  lib/constant-contact.js   → Constant Contact V3    │
│  lib/email-templates.js    → HTML email builders    │
└─────────────────────────────────────────────────────┘
```

**No API keys are exposed on the client side.** All secrets live in Vercel environment variables.

---

## Current Status

The backend is **fully deployed and verified**. Everything below this section is for reference or future events. If you just want to finish wiring the form into Webflow, skip to **Step 4**.

### What's already done

- **Resend** — API key set; sending from `FANWMG <info@fanwmg.com>` (domain verified)
- **Constant Contact OAuth2** — Client ID, Client Secret, and bootstrap refresh token seeded. The rotated token now lives in Upstash Redis and self-rotates on every request, so the 24-hour expiry is no longer an issue
- **Upstash Redis** — Provisioned and wired up in `lib/cc-auth.js`. Keys in use: `cc:refresh_token` (rotated refresh token), `cc:access_token` (cached access token)
- **Vercel deployment** — Live at **`https://custom-form-mu-mocha.vercel.app`** (production alias; stable across redeploys)
- **Environment variables on Vercel (production)** — `RESEND_API_KEY`, `EMAIL_FROM`, `CC_CLIENT_ID`, `CC_CLIENT_SECRET`, `CC_REFRESH_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `CC_LIST_ID_APR_MV`
- **Smoke test** — `POST /api/register` returns `{ success: true }`, confirmation + internal emails deliver, contact lands in the APR MV list

### What's left to do

1. **Embed the form in Webflow** for the APR MV event (see Step 4 below — concrete and specific to this deployment)
2. **Per-event setup** as each of the remaining 6 events goes live — new CC list, new env var, new Webflow embed (see Step 5)

### Key values you'll need

| Thing | Value |
|---|---|
| Production API endpoint | `https://custom-form-mu-mocha.vercel.app/api/register` |
| First event ID | `apr-mv-retirement-2026` |
| First event CC list UUID | `1c172838-2e9b-11f1-8d93-02420a320002` (already in `CC_LIST_ID_APR_MV`) |

---

## File Structure

```
custom-form/
├── registration-form.html      ← Frontend embed (copy into Webflow)
├── api/
│   └── register.js             ← Vercel serverless POST endpoint
├── config/
│   └── events.js               ← Event configuration (all 7 events)
├── lib/
│   ├── email.js                ← Email sending via Resend
│   ├── email-templates.js      ← Internal + guest email HTML builders
│   └── constant-contact.js     ← Constant Contact contact upsert
├── package.json
├── vercel.json                 ← Vercel routing config
├── .env.example                ← Template for environment variables
├── .gitignore
└── SETUP.md                    ← This file
```

---

## Step 1: Set Up Email Service (Resend)

1. Create an account at [resend.com](https://resend.com)
2. Verify your sending domain (e.g. `fanwmg.com`)
3. Create an API key
4. Note the API key — you'll add it to Vercel env vars later

**Alternative:** To use SendGrid instead, swap `lib/email.js` with SendGrid's `@sendgrid/mail` package.

---

## Step 2: Set Up Constant Contact

1. Log in to the [Constant Contact Developer Portal](https://developer.constantcontact.com/)
2. Create an application → get your **Client ID** and **Client Secret**
3. Complete the OAuth2 flow to get an **Access Token**
4. In Constant Contact:
   - Create a **List** for each event (e.g. "APR MV Retirement 2026")
   - Note each list's UUID
   - Optionally create **Tags** for event tracking
5. Note the access token and list IDs

**Recommendation:** Register BOTH the primary registrant AND all guests as contacts. This captures every attendee email per your requirements.

### 2b. Set up Upstash Redis (required for refresh-token persistence)

Constant Contact rotates refresh tokens — every exchange returns a new refresh token and the old one dies within 24 hours. Without persistent storage, the form would break every day. We store the rotated token in Upstash Redis.

1. Create a free account at [upstash.com](https://upstash.com/)
2. Create a Redis database (any region, free tier is fine)
3. On the database page, copy the **REST URL** and **REST Token**
4. Add them to Vercel as `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

On the first request after deploy, the backend reads `CC_REFRESH_TOKEN` from env, exchanges it, and writes the rotated token to Redis. Every subsequent call reads from Redis and updates it in place. You will never need to re-run `scripts/cc-get-token.js` unless the stored token is lost.

---

## Step 3: Deploy Backend to Vercel

### 3a. Install Vercel CLI

```bash
npm install -g vercel
```

### 3b. Link project

```bash
cd custom-form
vercel link
```

### 3c. Add Environment Variables

In the [Vercel Dashboard](https://vercel.com) → Project → Settings → Environment Variables, add:

| Variable | Value |
|---|---|
| `RESEND_API_KEY` | Your Resend API key |
| `EMAIL_FROM` | `FANWMG <noreply@fanwmg.com>` |
| `CC_CLIENT_ID` | Constant Contact OAuth2 Client ID |
| `CC_CLIENT_SECRET` | Constant Contact OAuth2 Client Secret |
| `CC_REFRESH_TOKEN` | Bootstrap refresh token from `scripts/cc-get-token.js` (used only on first run; after that the rotated token lives in Redis) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL (see Step 2b) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token (see Step 2b) |
| `CC_LIST_ID_APR_MV` | List UUID for APR MV event |
| `CC_LIST_ID_EVENT_2` | List UUID for event 2 |
| ... | (one per event) |

### 3d. Deploy

```bash
vercel --prod
```

Note your production URL (e.g. `https://your-project.vercel.app`).

### 3e. Local development

```bash
cp .env.example .env
# Fill in .env with real values
vercel dev
```

---

## Step 4: Embed in Webflow

The form file is **23.7 KB** — comfortably under Webflow's 50 KB Embed limit, so everything goes into a single Embed component.

### 4a. Add the Google Font (one-time, project-wide)

In Webflow Designer → **Project Settings → Custom Code → Head Code**, paste:

```html
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap" rel="stylesheet" />
```

Click **Save Changes**. This only needs to be done once for the whole Webflow project, not per page.

### 4b. Drop an Embed component on the page

1. Open the page where the APR MV registration should appear
2. From the left panel, drag an **Embed** element (labeled `</>` or "HTML Embed") onto the canvas
3. The code editor modal opens

### 4c. Paste the widget code

Open `registration-form.html` in a text editor. You need three chunks, in this order, inside the single Embed:

| From file | What it is |
|---|---|
| Lines **11–245** | The entire `<style>...</style>` block (keep the opening and closing tags) |
| Lines **253–283** | The `<div id="reg-widget">...</div>` markup |
| Lines **286–end** | The entire `<script>...</script>` block |

**Easier shortcut:** copy everything from line **11** to end-of-file, then delete lines 246–252 (the `</style>`, `</head>`, `<body>`, and widget comment header — none of that is needed inside an Embed).

### 4d. Update the API endpoint in the pasted code

Find the `CONFIG` block near the top of the `<script>` (around line 306 in the source):

```javascript
var CONFIG = {
  eventId: "apr-mv-retirement-2026",
  apiEndpoint: "/api/register",
  maxGuests: 5
};
```

Change `apiEndpoint` to the production URL:

```javascript
var CONFIG = {
  eventId: "apr-mv-retirement-2026",
  apiEndpoint: "https://custom-form-mu-mocha.vercel.app/api/register",
  maxGuests: 5
};
```

Leave `eventId` as-is for the APR MV event.

### 4e. Save and publish

1. Click **Save & Close** on the Embed editor
2. Embeds do **not** render live inside the Designer — this is normal. You must **Publish** the page (top-right) to see it on the staging or live URL
3. Load the published page in a browser

### 4f. End-to-end verification

On the live Webflow page, fill out the form with a real email you can check and submit. Confirm:

- The form renders (3-column layout on desktop, single-column on mobile)
- On submit, the success screen "Thank you! Your submission has been received!" appears
- The registrant email gets a confirmation from `FANWMG <info@fanwmg.com>`
- `info@fanwmg.com` and `macaela@fanwmg.com` both receive an internal notification
- A new contact appears in the Constant Contact APR MV list

If the form visibly submits but nothing shows up downstream, open browser DevTools → Network tab and inspect the `POST /api/register` call. Paste its status/response into a chat session and it can be diagnosed. The most common issues are:

- **CORS error** — `apiEndpoint` was typo'd or pointed at a different domain
- **404** — `apiEndpoint` is missing `/api/register` at the end
- **500** — check `vercel logs https://custom-form-mu-mocha.vercel.app` for the real error

---

## Step 5: Reuse for All 7 Events

For each new event:

### 5a. Add event config

In `config/events.js`, add a new entry:

```javascript
"may-event-name-2026": {
  eventId: "may-event-name-2026",
  eventName: "MAY EVENT NAME 2026",
  eventSubtitle: "Description...",
  presenters: "...",
  eventDates: [
    { label: "Day 1", day: "Saturday, May 9, 2026", room: "Room A", note: "" }
  ],
  time: "9:00am to 12:00pm",
  location: { name: "...", address: "...", room: "...", city: "...", state: "...", zip: "...", country: "United States" },
  constantContactListId: process.env.CC_LIST_ID_EVENT_2 || "",
  tags: ["may-event-2026"],
  internalRecipients: ["macaela@fanwmg.com", "info@fanwmg.com"],
  maxAttendees: 5,
},
```

### 5b. Create a new Webflow Embed

Copy the same embed code but change the `CONFIG.eventId`:

```javascript
var CONFIG = {
  eventId: "may-event-name-2026",   // ← changed
  apiEndpoint: "https://your-project.vercel.app/api/register",
  maxGuests: 5
};
```

### 5c. Add Constant Contact list

1. Create a new list in Constant Contact
2. Add the list UUID as a new env var in Vercel (e.g. `CC_LIST_ID_EVENT_2`)
3. Redeploy: `vercel --prod`

---

## Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| **Desktop** (>768px) | 3-column rows, inline tabs, side-by-side buttons |
| **Tablet** (601–768px) | Tighter padding, fields still side-by-side |
| **Mobile** (≤600px) | Single column, stacked fields, full-width buttons, compact tabs |

---

## Validation Summary

| Field | Rule | Error Message |
|---|---|---|
| First Name | Non-empty | "First name is required." |
| Last Name | Non-empty | "Last name is required." |
| Email | Valid format | "Please enter a valid email address." |
| Phone | 10 US digits | "Please enter a valid phone number." |
| Address | Non-empty | "Address is required." |
| Referral | Non-empty (registrant only) | "Referral name is required." |
| Guest First Name | Non-empty | "Guest first name is required." |
| Guest Last Name | Non-empty | "Guest last name is required." |
| Guest Email | Valid format | "Guest email is required." |

Validation runs on **all guests** at submit time. The form navigates to the first guest with an error, shows inline messages, and focuses the first invalid field.

---

## Troubleshooting

- **CORS error**: Ensure `vercel.json` routes are correct and the API sets CORS headers
- **Emails not sending**: Check Resend dashboard for delivery logs; verify domain is verified
- **Constant Contact 401 after 24h**: The rotated refresh token is not being persisted. Check that `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set in Vercel and that the Upstash DB is reachable. If the stored token is truly lost, re-run `node scripts/cc-get-token.js`, update `CC_REFRESH_TOKEN`, and manually delete the `cc:refresh_token` key in Upstash so the new bootstrap token is picked up.
- **Form not appearing**: Ensure the Embed component in Webflow has the full HTML/CSS/JS
