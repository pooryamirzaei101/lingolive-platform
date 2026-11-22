import { isAdmin } from "@/lib/admin";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { integrationConfig, decryptKey, encryptKey } from "@/lib/media-integrations";
import { getDb } from "@/db";
import { mediaIntegrations } from "@/db/schema";
import { eq } from "drizzle-orm";

function oauthUser(request: Request, userId?: string) {
  if (userId) return userId;
  const host = new URL(request.url).hostname;
  if (process.env.LOCAL_ADMIN_MODE === "true" && (host === "localhost" || host === "127.0.0.1" || host === "[::1]")) return process.env.ADMIN_EMAIL || "local-admin";
  throw new Error("Sign in as the administrator before connecting YouTube.");
}

export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Not authorized", { status: 403 });
  const url = new URL(request.url);
  const cookie = /\byoutube_oauth_state=([^;]+)/.exec(request.headers.get("cookie") || "");
  try {
    if (!cookie) throw new Error("Connection session expired. Start again.");
    const state = JSON.parse(await decryptKey(decodeURIComponent(cookie[1])));
    const user = await getChatGPTUser();
    if (state.nonce !== url.searchParams.get("state") || state.userId !== oauthUser(request, user?.userId) || state.expires < Date.now()) throw new Error("Invalid connection session.");
    if (url.searchParams.get("error")) throw new Error("YouTube connection was not approved.");
    const code = url.searchParams.get("code"); if (!code) throw new Error("Missing authorization code.");
    const c = await integrationConfig({ youtube: true, translation: false });
    const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: c.youtubeClientId, client_secret: c.youtubeClientSecret, code, grant_type: "authorization_code", redirect_uri: `${url.origin}/api/admin/youtube-oauth/callback` }), signal: AbortSignal.timeout(15000) });
    const data = await response.json() as any;
    if (!response.ok || !data.refresh_token) throw new Error("Google did not provide offline access. Reconnect and approve access.");
    await getDb().update(mediaIntegrations).set({ youtubeRefreshToken: await encryptKey(data.refresh_token) }).where(eq(mediaIntegrations.id, "main"));
    return new Response(null, { status: 302, headers: { Location: "/administration/media-apis?youtube=connected", "Set-Cookie": "youtube_oauth_state=; HttpOnly; SameSite=Lax; Path=/api/admin/youtube-oauth; Max-Age=0", "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not connect." }, { status: 400, headers: { "Cache-Control": "no-store" } }); }
}