// google-oauth-callback
//
// Google redirects the user's browser here after they approve (or deny)
// the consent screen — this is a plain top-level navigation, not a fetch
// call, so it takes no Authorization header and must respond with an HTTP
// redirect back into the app rather than JSON.
//
// Authorization model: instead of a JWT (which Google's redirect can't
// carry), this relies on the `state` parameter minted by google-oauth-start
// and stored in google_oauth_states, tied to the user id that initiated the
// flow. It's single-use (deleted on first use) and short-lived (rejected
// after 10 minutes), which is what makes it a valid CSRF/replay defense.

import { adminClient, requireEnv } from "../_shared/google.ts";

function redirectTo(appUrl: string, params: Record<string, string>): Response {
  const url = new URL("/dashboard/sheets", appUrl);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const googleError = url.searchParams.get("error");

  let appUrl: string;
  try {
    appUrl = requireEnv("PUBLIC_APP_URL");
  } catch {
    // Nowhere safe to redirect to — this is a genuine deployment
    // misconfiguration, so surface it directly rather than guessing a URL.
    return new Response(
      "Google Sheets integration is misconfigured: PUBLIC_APP_URL is not set in this project's Edge Function secrets.",
      { status: 500 },
    );
  }

  if (googleError) {
    return redirectTo(appUrl, { google: "error", message: googleError });
  }
  if (!code || !state) {
    return redirectTo(appUrl, { google: "error", message: "missing_code_or_state" });
  }

  const admin = adminClient();

  const { data: stateRow, error: stateError } = await admin
    .from("google_oauth_states")
    .select("user_id, created_at")
    .eq("state", state)
    .maybeSingle();

  // Single-use: consume it immediately regardless of outcome below.
  if (stateRow) {
    await admin.from("google_oauth_states").delete().eq("state", state);
  }

  if (stateError || !stateRow) {
    return redirectTo(appUrl, { google: "error", message: "invalid_or_expired_state" });
  }
  const isExpired = Date.now() - new Date(stateRow.created_at).getTime() > 10 * 60 * 1000;
  if (isExpired) {
    return redirectTo(appUrl, { google: "error", message: "expired_state" });
  }
  const userId = stateRow.user_id as string;

  let clientId: string, clientSecret: string;
  try {
    clientId = requireEnv("GOOGLE_CLIENT_ID");
    clientSecret = requireEnv("GOOGLE_CLIENT_SECRET");
  } catch {
    return redirectTo(appUrl, { google: "error", message: "not_configured" });
  }

  const redirectUri = `${new URL(req.url).origin}/functions/v1/google-oauth-callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const tokenPayload = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok) {
    console.error("[google-oauth-callback] token exchange failed", tokenPayload);
    return redirectTo(appUrl, { google: "error", message: "token_exchange_failed" });
  }

  const accessToken = tokenPayload.access_token as string;
  const refreshToken: string | null = tokenPayload.refresh_token ?? null;
  const expiresIn = Number(tokenPayload.expires_in ?? 3600);
  const scopes: string[] = typeof tokenPayload.scope === "string" ? tokenPayload.scope.split(" ") : [];
  const tokenExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const profile = await profileRes.json().catch(() => ({}));
  const googleEmail: string | null = profile?.email ?? null;
  const googleAccountId: string | null = profile?.id ?? null;

  const { data: existing } = await admin.from("google_connections").select("id, refresh_token").eq("user_id", userId).maybeSingle();

  const baseFields = {
    google_email: googleEmail,
    google_account_id: googleAccountId,
    access_token: accessToken,
    token_expires_at: tokenExpiresAt,
    scopes,
    is_active: true,
    last_sync_error: null,
  };

  if (existing) {
    await admin
      .from("google_connections")
      .update({
        ...baseFields,
        // Google only returns a refresh_token on the first consent (or when
        // prompt=consent forces re-issue, which we always request) — but
        // fall back to the previous one defensively so a reconnect never
        // silently loses it if Google ever omits it.
        refresh_token: refreshToken ?? existing.refresh_token,
      })
      .eq("id", existing.id);
  } else {
    await admin.from("google_connections").insert({
      user_id: userId,
      refresh_token: refreshToken,
      ...baseFields,
    });
  }

  return redirectTo(appUrl, { google: "connected" });
});
