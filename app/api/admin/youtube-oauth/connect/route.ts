import { isAdmin } from "@/lib/admin";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { integrationConfig, encryptKey } from "@/lib/media-integrations";

function oauthUser(request: Request, userId?: string) {
  if (userId) return userId;
  const host = new URL(request.url).hostname;
  if (process.env.LOCAL_ADMIN_MODE === "true" && (host === "localhost" || host === "127.0.0.1" || host === "[::1]")) return process.env.ADMIN_EMAIL || "local-admin";
  throw new Error("Sign in as the administrator before connecting YouTube.");
}

export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Not authorized", { status: 403 });
  try {
    const user = await getChatGPTUser();
    const c = await integrationConfig({ youtube: true, translation: false });
    if (!c.youtubeClientId || !c.youtubeClientSecret) throw new Error("Save your Google OAuth client ID and secret first.");
    const nonce = crypto.randomUUID();
    const state = await encryptKey(JSON.stringify({ nonce, userId: oauthUser(request, user?.userId), expires: Date.now() + 600000 }));
    const origin = new URL(request.url).origin;
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.search = new URLSearchParams({ client_id: c.youtubeClientId, redirect_uri: `${origin}/api/admin/youtube-oauth/callback`, response_type: "code", scope: "https://www.googleapis.com/auth/youtube.force-ssl", access_type: "offline", prompt: "consent", state: nonce }).toString();
    return new Response(null, { status: 302, headers: { Location: url.toString(), "Set-Cookie": `youtube_oauth_state=${encodeURIComponent(state)}; HttpOnly; SameSite=Lax; Path=/api/admin/youtube-oauth; Max-Age=600${origin.startsWith("https:") ? "; Secure" : ""}`, "Cache-Control": "no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Could not connect." }, { status: 400 }); }
}