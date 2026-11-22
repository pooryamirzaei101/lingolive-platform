import { getChatGPTUser } from "@/app/chatgpt-auth";
import { isAdmin } from "@/lib/admin";
import { getDb, getMediaBucket } from "@/db";
import { supportMessages, supportTickets } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(request: Request) {
  const admin = await isAdmin(), user = await getChatGPTUser(), host = new URL(request.url).hostname;
  const localAdmin = admin && process.env.LOCAL_ADMIN_MODE === "true" && (host === "localhost" || host === "127.0.0.1" || host === "[::1]");
  if (!user && !localAdmin) return new Response("Sign in required", { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  const row = await getDb().select({ key: supportMessages.attachmentKey, type: supportMessages.attachmentType }).from(supportMessages).innerJoin(supportTickets, eq(supportMessages.ticketId, supportTickets.id)).where(and(eq(supportMessages.id, id), admin ? undefined : eq(supportTickets.userId, user!.userId))).get();
  if (!row?.key) return new Response("Not found", { status: 404 });
  const file = await getMediaBucket().get(row.key); if (!file) return new Response("Not found", { status: 404 });
  return new Response(file.body, { headers: { "Content-Type": row.type, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": `inline; filename="support-${row.type === "application/pdf" ? "attachment.pdf" : "image"}"` } });
}