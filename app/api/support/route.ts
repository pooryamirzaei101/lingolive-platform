import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { isAdmin } from "@/lib/admin";
import { getDb, getMediaBucket } from "@/db";
import { supportTickets as tickets, supportMessages as messages } from "@/db/schema";
import { and, eq, desc, asc, sql, gte, like, or } from "drizzle-orm";
import { supportCategories, supportStatuses, safeLessonPath, supportAttachmentType } from "@/lib/support";

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

async function actor(request: Request) {
  const admin = await isAdmin();
  const user = await getChatGPTUser();
  if (user) return { admin, user };
  const host = new URL(request.url).hostname;
  if (admin && process.env.LOCAL_ADMIN_MODE === "true" && (host === "localhost" || host === "127.0.0.1" || host === "[::1]")) {
    const email = process.env.ADMIN_EMAIL || "admin@localhost";
    return { admin: true, user: { userId: `local-admin:${email}`, displayName: "Administrator", email, fullName: "Administrator" } satisfies ChatGPTUser };
  }
  return { admin, user: null };
}

export async function GET(request: Request) {
  const identity = await actor(request);
  if (!identity.user) return json({ error: "Sign in to view your support requests." }, 401);
  try {
    const db = getDb(), q = new URL(request.url).searchParams, id = q.get("id");
    if (id) {
      const ticket = await db.select().from(tickets).where(and(eq(tickets.id, id), identity.admin ? undefined : eq(tickets.userId, identity.user.userId))).get();
      if (!ticket) return json({ error: "Request not found." }, 404);
      const thread = await db.select({ id: messages.id, body: messages.body, isAdmin: messages.isAdmin, attachmentType: messages.attachmentType, createdAt: messages.createdAt, readByAdmin: messages.readByAdmin, readByUser: messages.readByUser }).from(messages).where(eq(messages.ticketId, id)).orderBy(asc(messages.createdAt), asc(messages.id)).limit(200);
      await db.update(tickets).set(identity.admin ? { adminUnread: 0 } : { userUnread: 0 }).where(eq(tickets.id, id));
      await db.update(messages).set(identity.admin ? { readByAdmin: 1 } : { readByUser: 1 }).where(eq(messages.ticketId, id));
      return json({ ticket: { ...ticket, ...(identity.admin ? { adminUnread: 0 } : { userUnread: 0 }) }, messages: thread });
    }
    const page = Math.max(1, Math.min(10000, Math.floor(Number(q.get("page"))) || 1));
    const status = q.get("status") || "", search = (q.get("search") || "").trim().slice(0, 100), sort = q.get("sort") === "oldest" ? "oldest" : "newest";
    const unread = q.get("unread") === "1";
    const searchCondition = search ? or(like(tickets.subject, `%${search}%`), identity.admin ? like(tickets.email, `%${search}%`) : undefined, sql`exists (select 1 from support_messages sm where sm.ticket_id = ${tickets.id} and sm.body ilike ${`%${search}%`})`) : undefined;
    const where = and(identity.admin ? undefined : eq(tickets.userId, identity.user.userId), Object.hasOwn(supportStatuses, status) ? eq(tickets.status, status) : undefined, unread ? eq(identity.admin ? tickets.adminUnread : tickets.userUnread, 1) : undefined, searchCondition);
    const total = Number((await db.select({ n: sql<number>`count(*)` }).from(tickets).where(where).get())?.n || 0);
    const unreadCount = Number((await db.select({ n: sql<number>`coalesce(sum(${identity.admin ? tickets.adminUnread : tickets.userUnread}), 0)` }).from(tickets).where(identity.admin ? undefined : eq(tickets.userId, identity.user.userId)).get())?.n || 0);
    const rows = await db.select().from(tickets).where(where).orderBy(sort === "oldest" ? asc(tickets.updatedAt) : desc(tickets.updatedAt)).limit(20).offset((page - 1) * 20);
    const enriched = await Promise.all(rows.map(async (ticket: typeof tickets.$inferSelect) => {
      const latest = await db.select({ body: messages.body, isAdmin: messages.isAdmin, createdAt: messages.createdAt }).from(messages).where(eq(messages.ticketId, ticket.id)).orderBy(desc(messages.createdAt), desc(messages.id)).limit(1).get();
      return { ...ticket, latestMessage: latest?.body || "", latestIsAdmin: latest?.isAdmin || 0 };
    }));
    return json({ tickets: enriched, total, page, unreadCount });
  } catch (error) { console.error("[support] GET failed", error); return json({ error: "Could not load support requests. Try again." }, 503); }
}

export async function POST(request: Request) {
  const identity = await actor(request);
  if (!identity.user) return json({ error: "Sign in to contact the administrator." }, 401);
  if (request.headers.get("origin") !== new URL(request.url).origin) return json({ error: "Invalid request origin." }, 403);
  if (Number(request.headers.get("content-length")) > 6 * 1024 * 1024) return json({ error: "Attachment must be at most 5 MB." }, 413);
  let storedKey = "";
  try {
    const db = getDb(), form = await request.formData(), action = String(form.get("action") || ""), now = Date.now(), id = String(form.get("id") || "");
    if (!["create", "reply", "status", "note", "delete"].includes(action)) return json({ error: "Choose a valid action." }, 400);
    const ticket = action === "create" ? null : await db.select().from(tickets).where(and(eq(tickets.id, id), identity.admin ? undefined : eq(tickets.userId, identity.user.userId))).get();
    if (action !== "create" && !ticket) return json({ error: "Request not found." }, 404);
    if (["status", "note", "delete"].includes(action) && !identity.admin) return json({ error: "Only the administrator can perform this action." }, 403);
    if (action === "status") {
      const status = String(form.get("status") || ""); if (!Object.hasOwn(supportStatuses, status)) return json({ error: "Choose a valid status." }, 400);
      await db.update(tickets).set({ status, updatedAt: now }).where(eq(tickets.id, id)); return json({ id, message: "Ticket status updated." });
    }
    if (action === "note") {
      const internalNote = String(form.get("internalNote") || "").trim().slice(0, 4000);
      await db.update(tickets).set({ internalNote, updatedAt: now }).where(eq(tickets.id, id)); return json({ id, message: "Internal note saved." });
    }
    if (action === "delete") {
      const attachments = await db.select({ key: messages.attachmentKey }).from(messages).where(eq(messages.ticketId, id)).all();
      await db.delete(messages).where(eq(messages.ticketId, id));
      await db.delete(tickets).where(eq(tickets.id, id));
      for (const item of attachments) if (item.key) await getMediaBucket().delete(item.key).catch(() => {});
      return json({ id, deleted: true, message: "Ticket deleted." });
    }
    const body = String(form.get("body") || "").trim();
    if (body.length < 10 || body.length > 2000) return json({ error: "Enter a message between 10 and 2,000 characters." }, 400);
    const recentMessageRow = await db
      .select({ n: sql<number>`count(*)` })
      .from(messages)
      .where(and(eq(messages.authorId, identity.user.userId), gte(messages.createdAt, now - 60000)))
      .get();
    const recentMessages = Number(recentMessageRow?.n || 0);
    if (recentMessages >= 5) return json({ error: "Please wait before sending more messages (maximum 5 per minute)." }, 429);
    let subject = "", category = "other", priority = "normal", lessonPath = "";
    if (action === "create") {
      subject = String(form.get("subject") || "").trim().slice(0, 120) || body.split(/\r?\n/)[0].slice(0, 120);
      category = String(form.get("category") || "other"); priority = String(form.get("priority") || "normal"); lessonPath = String(form.get("lessonPath") || "").trim();
      if (!Object.hasOwn(supportCategories, category) || !["normal", "urgent"].includes(priority) || !safeLessonPath(lessonPath)) return json({ error: "Check the category, priority, and lesson path." }, 400);
      const recentTicketRow = await db
        .select({ n: sql<number>`count(*)` })
        .from(tickets)
        .where(and(eq(tickets.userId, identity.user.userId), gte(tickets.createdAt, now - 60000)))
        .get();
      const recentTickets = Number(recentTicketRow?.n || 0);
      if (recentTickets >= 5) return json({ error: "Please wait before creating more tickets (maximum 5 per minute)." }, 429);
    } else {
      const count = Number((await db.select({ n: sql<number>`count(*)` }).from(messages).where(eq(messages.ticketId, id)).get())?.n || 0); if (count >= 200) return json({ error: "This conversation is full. Please start a new request." }, 400);
    }
    const file = form.get("attachment"); let attachmentType = "";
    if (file && typeof file !== "string" && file.size) {
      if (file.size > 5 * 1024 * 1024) return json({ error: "Attachment must be at most 5 MB." }, 413);
      const bytes = new Uint8Array(await file.arrayBuffer()); attachmentType = supportAttachmentType(bytes);
      if (!attachmentType) return json({ error: "Choose a PNG, JPEG, WebP, or PDF attachment." }, 400);
      storedKey = `support/${crypto.randomUUID()}`; await getMediaBucket().put(storedKey, bytes, { httpMetadata: { contentType: attachmentType } });
    }
    const ticketId = action === "create" ? crypto.randomUUID() : id;
    const entry = db.insert(messages).values({ id: crypto.randomUUID(), ticketId, authorId: identity.user.userId, isAdmin: identity.admin ? 1 : 0, body, attachmentKey: storedKey, attachmentType, readByAdmin: identity.admin ? 1 : 0, readByUser: identity.admin ? 0 : 1, createdAt: now });
    if (action === "create") {
      await db.insert(tickets).values({ id: ticketId, userId: identity.user.userId, email: identity.user.email, name: identity.user.displayName || "Student", subject, category, priority, lessonPath, status: "open", adminUnread: identity.admin ? 0 : 1, userUnread: 0, createdAt: now, updatedAt: now });
      await entry;
    } else {
      await entry;
      await db.update(tickets).set({ updatedAt: now, status: identity.admin ? "answered" : "open", adminUnread: identity.admin ? 0 : 1, userUnread: identity.admin ? 1 : 0 }).where(eq(tickets.id, id));
    }
    storedKey = "";
    return json({ id: ticketId, message: action === "create" ? "Your message has been sent. An admin will reply soon." : "Reply sent." }, action === "create" ? 201 : 200);
  } catch (error) { console.error("[support] POST failed", error); if (storedKey) await getMediaBucket().delete(storedKey).catch(() => {}); return json({ error: "Could not save your message. Please try again." }, 503); }
}