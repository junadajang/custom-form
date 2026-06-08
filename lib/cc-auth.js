/**
 * Constant Contact OAuth2 Token Management
 *
 * Constant Contact issues rotating refresh tokens: every /token call returns
 * a NEW refresh token and invalidates the old one within ~24 hours. We must
 * persist the new refresh token across serverless invocations, otherwise the
 * form breaks every day.
 *
 * Persistence: Upstash Redis (free tier is more than enough for this form).
 * Keys:
 *   cc:refresh_token  → the current rotated refresh token
 *   cc:access_token   → JSON { token, expiresAt } shared across warm lambdas
 *
 * Bootstrap: if Redis has no refresh token yet, we read CC_REFRESH_TOKEN from
 * env and seed Redis on the first successful exchange. After that the env var
 * is ignored.
 *
 * Environment variables:
 *   CC_CLIENT_ID                — OAuth2 Client ID (API Key)
 *   CC_CLIENT_SECRET            — OAuth2 Client Secret
 *   CC_REFRESH_TOKEN            — Bootstrap refresh token (first run only)
 *   UPSTASH_REDIS_REST_URL      — Upstash REST URL
 *   UPSTASH_REDIS_REST_TOKEN    — Upstash REST token
 */

const { Redis } = require("@upstash/redis");

const CC_CLIENT_ID = process.env.CC_CLIENT_ID;
const CC_CLIENT_SECRET = process.env.CC_CLIENT_SECRET;
const CC_REFRESH_TOKEN_BOOTSTRAP = process.env.CC_REFRESH_TOKEN;
const CC_TOKEN_URL = "https://authz.constantcontact.com/oauth2/default/v1/token";

const REFRESH_KEY = "cc:refresh_token";
const ACCESS_KEY = "cc:access_token";

let memoryToken = null;
let memoryExpiry = 0;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

async function loadRefreshToken(redis) {
  if (redis) {
    const stored = await redis.get(REFRESH_KEY);
    if (stored) return stored;
  }
  return CC_REFRESH_TOKEN_BOOTSTRAP || null;
}

async function exchangeRefreshToken(refreshToken) {
  const credentials = Buffer.from(`${CC_CLIENT_ID}:${CC_CLIENT_SECRET}`).toString("base64");

  const res = await fetch(CC_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `refresh_token=${encodeURIComponent(refreshToken)}&grant_type=refresh_token`,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`CC token refresh failed (${res.status}): ${body}`);
  }

  return res.json();
}

async function getAccessToken() {
  if (memoryToken && Date.now() < memoryExpiry - 60000) {
    return memoryToken;
  }

  if (!CC_CLIENT_ID || !CC_CLIENT_SECRET) {
    throw new Error("Constant Contact auth not configured. Set CC_CLIENT_ID and CC_CLIENT_SECRET.");
  }

  const redis = getRedis();

  // Warm-lambda shortcut: reuse a token another invocation stored in Redis.
  if (redis) {
    const cached = await redis.get(ACCESS_KEY);
    if (cached && cached.token && Date.now() < cached.expiresAt - 60000) {
      memoryToken = cached.token;
      memoryExpiry = cached.expiresAt;
      return memoryToken;
    }
  }

  const refreshToken = await loadRefreshToken(redis);
  if (!refreshToken) {
    throw new Error(
      "No Constant Contact refresh token. Seed CC_REFRESH_TOKEN via scripts/cc-get-token.js."
    );
  }

  const data = await exchangeRefreshToken(refreshToken);
  const expiresAt = Date.now() + (data.expires_in || 7200) * 1000;

  memoryToken = data.access_token;
  memoryExpiry = expiresAt;

  if (redis) {
    // Rotate: persist the new refresh token immediately. If this write fails,
    // the next invocation will retry with the old token — CC honors the old
    // one for a short window, so one failure isn't fatal, but log it.
    const writes = [];
    if (data.refresh_token && data.refresh_token !== refreshToken) {
      writes.push(redis.set(REFRESH_KEY, data.refresh_token));
    }
    writes.push(
      redis.set(
        ACCESS_KEY,
        { token: data.access_token, expiresAt },
        { ex: data.expires_in || 7200 }
      )
    );
    try {
      await Promise.all(writes);
    } catch (err) {
      console.error("CC token persistence failed:", err.message);
    }
  }

  return memoryToken;
}

module.exports = { getAccessToken };
