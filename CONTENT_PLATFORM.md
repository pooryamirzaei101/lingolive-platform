# LingoLive Content Platform

## Local routes

- Video catalog: `http://localhost:3000/video-lessons`
- Requested aliases: `/lessons`, `/youtube-lessons`, `/ielts-speaking`
- Podcasts: `http://localhost:3000/podcasts`
- News: `http://localhost:3000/news`
- Unified media studio: `http://localhost:3000/administration/media`
- News studio: `http://localhost:3000/administration/news`
- Requested admin alias: `/admin/content`

## Local content setup

```powershell
node scripts/migrate-local-news.mjs
node scripts/seed-content-platform.mjs
npm run dev
```

The seed creates one published VPS-hosted video, one YouTube lesson, one local podcast, one IELTS speaking-video entry, and one published News post. The VPS video and podcast use local bundled media and support HTTP byte ranges for seeking.

## Content workflow

Use **Administration → All-section media studio** to create a draft, choose an upload or YouTube source, import SRT or generate a timestamped English transcript through configured media APIs, generate/edit a translation, preview, and publish. Existing media editors provide draft/publish actions, transcript editing, thumbnail/source management, and API connection settings.

## Learner features

Published video, YouTube, and podcast lessons provide a language selector, synchronized original/translation transcript lines, active-line scrolling, word lookup and Word Bank saving, sentence saving to My Collection, per-sentence loop, playback speed, and resumed playback. Podcast lessons now have the same dual-transcript, sentence-save, loop, and speed controls.

## Media reliability

The protected media response includes `Accept-Ranges`, `Content-Range`, inline content headers, same-origin CORS exposure, and secure no-sniff headers. Local test media must be a real decodable MP4/WebM or audio file; a prior 24-byte placeholder was preserved as `upload-test.mp4.broken-24-byte.bak` and replaced with a valid bundled sample.

## API providers

Transcript generation and translation remain opt-in. Configure them under `/administration/media-apis`; provider credentials are required before generation actions can run. YouTube captions can be imported only for a connected channel with permission to edit the video.