# LingoLive Platform

Fresh, self-hosted LingoLive application. This repository is independent from the legacy `lingolive-latest` codebase.

## Module 1 scope

- npm workspace monorepo with Next.js web and NestJS REST API
- PostgreSQL schema and checked-in Prisma migration
- Redis service ready for caching and BullMQ jobs in later modules
- registration, email verification, login, logout, password reset
- Argon2id password hashing with an application pepper
- opaque server-side sessions stored only as SHA-256 hashes
- student/editor/super-admin roles and paid-access grant foundation
- secure HTTP-only cookies, validation, Helmet, constrained CORS
- Docker Compose services and production-oriented multi-stage images
- health endpoint and token tests

Email delivery is intentionally represented by generated token records in Module 1. In development the API returns verification/reset tokens; production suppresses them. An SMTP queue and templates will be connected before launch.

## Local setup

1. Copy `.env.example` to `.env` and replace every secret.
2. Run `npm install`.
3. Start PostgreSQL and Redis with Docker Compose.
4. Run `npm run prisma:generate` and `npm run prisma:migrate`.
5. Run `npm run dev`.

Web: `http://localhost:3000`  
API health: `http://localhost:4000/api/v1/health`

## Verification

```text
npm run typecheck
npm test
npm run build
```

Docker is required for end-to-end database and container verification. It was not available on the original Windows authoring host, so those checks should run on a Docker-enabled workstation or Ubuntu VPS.

## Security model

Lesson routes added in later modules must require an active, non-revoked `AccessGrant`; authentication alone never grants lesson access. Administrators bypass lesson access only through explicit role checks. Raw session, verification, and reset tokens are never stored in PostgreSQL. Password reset invalidates every active session.

## Reference ZIP review

The supplied legacy archive was reviewed for product ideas only. Reused concepts include membership gating, private media authorization, bilingual/RTL presentation, learning progress, and separate administration surfaces. Its Supabase auth, mixed legacy migrations, Cloudflare/Vinext adapters, and monolithic feature code were deliberately not copied.

## Next module (requires approval)

Module 2 will add the administration shell, explicit role guards, initial user management, audit logging, and plan configuration. Do not begin it until Module 1 is approved.
