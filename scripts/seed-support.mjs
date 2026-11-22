import { PGlite } from "@electric-sql/pglite";

const db = new PGlite("file://local-data/pglite");
await db.waitReady;
const now = Date.now();
const tickets = [
  ["support-seed-learner-one", "local-learner-one", "learner.one@gmail.com", "Learner One", "Question about lesson access", "access", "normal", "/lessons", "open", 1, 0, "Demo ticket for local testing", now - 5400000, now - 1800000],
  ["support-seed-learner-two", "local-learner-two", "learner.two@gmail.com", "Learner Two", "Pronunciation upload feedback", "lesson", "normal", "/video-lessons", "answered", 0, 1, "", now - 9000000, now - 900000],
];
for (const row of tickets) {
  await db.query(`insert into support_tickets
    (id,user_id,email,name,subject,category,priority,lesson_path,status,admin_unread,user_unread,internal_note,created_at,updated_at)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    on conflict (id) do update set email=excluded.email,name=excluded.name,subject=excluded.subject,category=excluded.category,priority=excluded.priority,lesson_path=excluded.lesson_path,status=excluded.status,admin_unread=excluded.admin_unread,user_unread=excluded.user_unread,internal_note=excluded.internal_note,updated_at=excluded.updated_at`, row);
}
const messages = [
  ["support-seed-message-1", "support-seed-learner-one", "local-learner-one", 0, "Hello, I completed payment but the advanced lesson still looks locked. Can you check my access?", "", "", 0, 1, now - 1800000],
  ["support-seed-message-2", "support-seed-learner-two", "local-learner-two", 0, "Could an admin review my pronunciation upload and tell me which sounds need more practice?", "", "", 1, 1, now - 3600000],
  ["support-seed-message-3", "support-seed-learner-two", "local-super-admin", 1, "Yes. Focus first on the TH sound and the final consonants. I have marked this ticket as answered.", "", "", 1, 0, now - 900000],
];
for (const row of messages) {
  await db.query(`insert into support_messages
    (id,ticket_id,author_id,is_admin,body,attachment_key,attachment_type,read_by_admin,read_by_user,created_at)
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    on conflict (id) do update set body=excluded.body,read_by_admin=excluded.read_by_admin,read_by_user=excluded.read_by_user,created_at=excluded.created_at`, row);
}
console.log("support-seed=ready tickets=2 messages=3");
await db.close();