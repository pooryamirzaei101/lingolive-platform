# LingoLive Support Inbox

The local support system is available at:

- User tickets: `http://localhost:3000/support`
- Admin inbox: `http://localhost:3000/administration/support`

## Local setup

1. Run `node scripts/migrate-local-support.mjs` to apply the idempotent support migration.
2. Run `node scripts/seed-support.mjs` to create two demonstration tickets.
3. Run `npm run dev` and open the routes above.

The local database is persisted in `local-data/pglite`. The configured initial super-admin email is read from `ADMIN_EMAIL`/`SUPER_ADMIN_EMAIL`. Local administrator fallback is accepted only for loopback requests when `LOCAL_ADMIN_MODE=true`.

## Features

Users get an authenticated Contact Admin form with a read-only session email, optional subject, 10–2,000 character messages, image/PDF attachments up to 5 MB, conversation history, statuses, and unread indicators. Users can only access their own tickets.

Administrators get a searchable, filterable two-column inbox with the user's email, newest/oldest sorting, unread badges, threaded replies, internal notes, status actions, reopen and delete controls. The page polls every 10 seconds as a local-development realtime fallback.

The API validates message lengths and attachment signatures, sanitizes display through React text rendering, enforces ownership and administrator actions server-side, and rate-limits ticket/message creation to five per minute per user.

## Local test checklist

- Open the admin inbox and confirm the two seeded Gmail users are visible.
- Open the unread ticket, reply, and mark it Answered.
- Search for `learner.one@gmail.com` and filter by Answered or Closed.
- Save an internal note and verify it is not rendered in the user conversation.
- Sign in as a normal user, open `/support`, create a ticket, then reply to the resulting thread.
- Attach a PNG, JPEG, WebP, or PDF no larger than 5 MB.