# Admin Users and Newsletter

Open `http://localhost:3000/administration/users` while signed in as the configured administrator.

## Local setup

```powershell
node scripts/migrate-local-newsletters.mjs
node scripts/seed-admin-users.mjs
npm run dev
```

The repeatable seed creates `pooryamirzaei101@gmail.com` as the local administrator and ten learners with mixed Free/Premium and newsletter preferences. Local data persists under `local-data/pglite` and newsletter attachments under the configured media root.

## Users

The dashboard provides live Total, Free, Premium, and Newsletter counts; All/Free/Premium/Newsletter views; search and profile filters; sorting; pagination; add-user; Premium grant/revoke controls; newsletter consent controls; CSV export; joined and last-active dates. Changes are logged in `user_admin_audit`.

## Newsletters

The Newsletter view provides a composer for all subscribers or selected visible subscribers, subject and plain-text message validation, and up to five PDF, DOCX, XLSX, PNG, JPG, or ZIP attachments at 10 MB per file. Sent history stores recipient counts, delivery status, timestamps, and attachment metadata.

Local admin mode is deliberately archive-only: it stores the newsletter, recipients, and files but never transmits subscriber data externally. For production email delivery, set these variables and run with `LOCAL_ADMIN_MODE=false`:

```env
RESEND_API_KEY=your_resend_key
NEWSLETTER_FROM_EMAIL=LingoLive <newsletter@your-verified-domain.com>
```

Each recipient receives an individual provider request, so addresses are not exposed to other recipients. Server-side admin guards, same-origin checks, consent filtering, rate limiting, file validation, and audit records are enforced.