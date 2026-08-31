// google-oauth-start
//
// Called by an authenticated host clicking "Connect Google Sheets". Mints a
// short-lived, single-use CSRF `state` token tied to their user id, and
// returns Google's consent URL for the browser to redirect to. The actual
// token exchange happens in google-oauth-callback once Google redirects
// back with an authorization code.
//
// Scopes requested are intentionally narrow:
//  - spreadsheets: read/write the spreadsheet this connection uses.
//  - drive.file: access only to files this app creates (or the user
//    explicitly opens with it) — NOT general Drive read access. This is
//    why "browse my existing spreadsheets" isn't offered in this
//    integration: doing that with drive.file scope alone isn't possible,
//    and a broader Drive scope would violate "as narrow as possible."
//    See the Phase 4 report for the full reasoning.

import { adminClient, CORS_HEADERS, functionUrl, HttpError, json, requireEnv, requireUser } from "../_shared/google.ts";

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = adminClient();

  let user;
  try {
    user = await requireUser(req, admin);
  } catch (err) {
    if (err instanceof HttpError) return json({ error: err.message }, err.status);
    throw err;
  }

  let clientId: string;
  try {
    clientId = requireEnv("GOOGLE_CLIENT_ID");
  } catch {
    return json(
      { error: "Google Sheets isn't configured yet. GOOGLE_CLIENT_ID is missing from the project's secrets." },
      503,
    );
  }

  const state = crypto.randomUUID();

  // Best-effort cleanup of old, abandoned states (>10 min). Not load-bearing.
  void admin
    .from("google_oauth_states")
    .delete()
    .lt("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

  const { error: insertError } = await admin.from("google_oauth_states").insert({ state, user_id: user.id });
  if (insertError) {
    console.error("[google-oauth-start] failed to store state", insertError);
    return json({ error: "Could not start the connection. Please try again." }, 500);
  }

  const redirectUri = functionUrl("google-oauth-callback");
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES.join(" "));
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent"); // ensures a refresh_token is issued every time
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("state", state);

  return json({ url: authUrl.toString() });
});
