#!/usr/bin/env node
/**
 * Constant Contact OAuth2 Token Helper
 *
 * This script walks you through the OAuth2 Authorization Code flow
 * to get a refresh token for Constant Contact.
 *
 * Usage:
 *   node scripts/cc-get-token.js
 *
 * Prerequisites:
 *   1. Go to https://developer.constantcontact.com → My Applications
 *   2. Copy your API Key (Client ID) and Client Secret
 *   3. Add "http://localhost:3333/callback" as a Redirect URI in your app settings
 *   4. Select "Long Lived Refresh Tokens" in OAuth2 settings
 *
 * The script will:
 *   1. Open your browser to authorize the app
 *   2. Listen for the callback on localhost:3333
 *   3. Exchange the code for tokens
 *   4. Print the values to paste into your .env file
 */

const http = require("http");
const { URL } = require("url");

// ── Read credentials from CLI prompts ──
const readline = require("readline");
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;
const AUTH_URL = "https://authz.constantcontact.com/oauth2/default/v1/authorize";
const TOKEN_URL = "https://authz.constantcontact.com/oauth2/default/v1/token";

(async function main() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  Constant Contact — OAuth2 Token Helper         ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  console.log("Before running this, make sure you've added this Redirect URI");
  console.log(`in your CC app settings: ${REDIRECT_URI}\n`);

  const clientId = (await ask("Enter your API Key (Client ID): ")).trim();
  const clientSecret = (await ask("Enter your Client Secret: ")).trim();

  if (!clientId || !clientSecret) {
    console.error("Client ID and Secret are required.");
    process.exit(1);
  }

  // Build authorization URL
  const authParams = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    scope: "contact_data offline_access",
    state: "cc-token-helper",
  });

  const authLink = `${AUTH_URL}?${authParams}`;

  console.log("\n── Step 1: Authorize in your browser ──\n");
  console.log("Open this URL in your browser:\n");
  console.log(authLink);
  console.log("\n(Waiting for callback on localhost:" + PORT + "...)\n");

  // Try to open the browser automatically
  try {
    const { exec } = require("child_process");
    const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
    exec(`${cmd} "${authLink}"`);
  } catch (_) {
    // Ignore — user can open manually
  }

  // Start local server to capture the callback
  const code = await new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:${PORT}`);

      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const authCode = url.searchParams.get("code");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end(`<h2>Authorization failed</h2><p>${error}</p>`);
        server.close();
        reject(new Error(`Authorization error: ${error}`));
        return;
      }

      if (!authCode) {
        res.writeHead(400, { "Content-Type": "text/html" });
        res.end("<h2>No authorization code received</h2>");
        server.close();
        reject(new Error("No authorization code"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<h2>Success! You can close this tab.</h2><p>Go back to the terminal.</p>");
      server.close();
      resolve(authCode);
    });

    server.listen(PORT, () => {});

    // Timeout after 2 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Timed out waiting for authorization callback."));
    }, 120000);
  });

  console.log("── Step 2: Exchanging code for tokens... ──\n");

  // Exchange authorization code for tokens
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const tokenRes = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text();
    console.error(`Token exchange failed (${tokenRes.status}): ${errBody}`);
    rl.close();
    process.exit(1);
  }

  const tokens = await tokenRes.json();

  console.log("══════════════════════════════════════════════════");
  console.log("  SUCCESS! Add these to your .env file:");
  console.log("══════════════════════════════════════════════════\n");
  console.log(`CC_CLIENT_ID=${clientId}`);
  console.log(`CC_CLIENT_SECRET=${clientSecret}`);
  console.log(`CC_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log("");

  if (tokens.access_token) {
    console.log("  (Access token — for reference, not needed in .env)");
    console.log(`  Access Token: ${tokens.access_token.substring(0, 30)}...`);
    console.log(`  Expires in: ${tokens.expires_in}s\n`);
  }

  console.log("The refresh token is long-lived and will be used to");
  console.log("automatically get fresh access tokens on each request.\n");

  rl.close();
})().catch((err) => {
  console.error("\nError:", err.message);
  rl.close();
  process.exit(1);
});
