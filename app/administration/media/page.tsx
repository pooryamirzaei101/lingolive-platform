import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { videoLessons } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { getVideoCategories } from "@/lib/video-categories";
import { VideoUpload, VideoEditor } from "@/components/video-admin";
import { mediaSections, savedMediaSections } from "@/lib/media-sections";

export const dynamic = "force-dynamic";

type MediaItem = typeof videoLessons.$inferSelect;
type StudioTab = "create" | "library";

const contentLabels: Record<string, string> = {
  video: "Uploaded video",
  youtube: "YouTube",
  podcast: "Podcast",
  speaking: "Speaking",
};

export default async function MediaStudio({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string; type?: string; status?: string }>;
}) {
  if (!(await isAdmin())) {
    return <section className="section shell"><h1>Media studio</h1><p>Administrator access is required.</p></section>;
  }

  const params = await searchParams;
  const tab: StudioTab = params.tab === "library" ? "library" : "create";
  const query = (params.q || "").trim().toLowerCase();
  const type = params.type || "all";
  const status = params.status || "all";

  let categories: Awaited<ReturnType<typeof getVideoCategories>> = [];
  let items: MediaItem[] = [];
  let databaseAvailable = true;
  try {
    const groups = await Promise.all(
      (["video", "youtube", "speaking", "podcast"] as const).map((section) => getVideoCategories(section)),
    );
    categories = groups.flat();
    items = await getDb().select().from(videoLessons).orderBy(desc(videoLessons.createdAt)).all() as MediaItem[];
  } catch (error) {
    console.error("[media-studio] Local database unavailable", error);
    databaseAvailable = false;
  }

  const filtered = items.filter((item) => {
    const matchesQuery = !query || `${item.title} ${item.description} ${item.category} ${item.tags}`.toLowerCase().includes(query);
    return matchesQuery && (type === "all" || item.contentKind === type) && (status === "all" || item.status === status);
  });
  const drafts = items.filter((item) => item.status === "draft").length;
  const published = items.filter((item) => item.status === "published").length;

  return (
    <section className="section shell admin-page unified-media-studio">
      <a href="/administration" className="folder-back">← Administration</a>
      <div className="media-studio-heading">
        <div>
          <span className="section-eyebrow">ALL-SECTION MEDIA STUDIO</span>
          <h1>Create once. Publish everywhere.</h1>
          <p>Build a lesson from an upload or YouTube source, prepare its English transcript and translations, then manage every media item from one library.</p>
        </div>
        <a className="button secondary" href="/administration/media-apis">API connections</a>
      </div>

      {!databaseAvailable && (
        <div className="notice media-studio-alert" role="status">
          <strong>The local content database is not connected.</strong>
          <span>The studio interface is available, but saving lessons and loading the library require the local database service.</span>
        </div>
      )}

      <nav className="media-studio-tabs" aria-label="Media studio views">
        <a className={tab === "create" ? "active" : ""} aria-current={tab === "create" ? "page" : undefined} href="/administration/media?tab=create">
          <span>1</span><strong>Create lesson</strong><small>Upload, transcribe and place content</small>
        </a>
        <a className={tab === "library" ? "active" : ""} aria-current={tab === "library" ? "page" : undefined} href="/administration/media?tab=library">
          <span>2</span><strong>Media library</strong><small>Find, reuse, edit and publish</small>
        </a>
      </nav>

      {tab === "create" ? (
        <div className="media-create-layout">
          <main className="detail-panel media-create-panel">
            <div className="media-panel-heading"><span className="media-step">STEP 1–3</span><h2>Create a new lesson</h2><p>Choose the source and destinations first. New content stays in Draft until you review and publish it.</p></div>
            {databaseAvailable ? <VideoUpload categories={categories} /> : <div className="media-disabled-state"><h3>Creation is temporarily paused</h3><p>Connect the local database to enable uploads and saving. Your form will appear here automatically.</p></div>}
          </main>
          <aside className="media-workflow-card">
            <span className="section-eyebrow">WORKFLOW</span>
            <h2>From source to lesson</h2>
            <ol>
              <li><strong>Add the source</strong><span>Upload video or podcast audio, or paste a YouTube URL.</span></li>
              <li><strong>Prepare English</strong><span>Import SRT, generate a transcript, or enter timed sentences manually.</span></li>
              <li><strong>Review and publish</strong><span>Add translations, preview the learner experience, then publish.</span></li>
            </ol>
            <a className="button secondary" href="/administration/media?tab=library">Open media library</a>
          </aside>
        </div>
      ) : (
        <div className="media-library-view">
          <div className="media-library-stats" aria-label="Library summary">
            <article><span>All media</span><strong>{items.length}</strong></article>
            <article><span>Drafts</span><strong>{drafts}</strong></article>
            <article><span>Published</span><strong>{published}</strong></article>
            <article><span>Showing</span><strong>{filtered.length}</strong></article>
          </div>

          <form className="media-library-filters" method="get">
            <input type="hidden" name="tab" value="library" />
            <label>Search library<input name="q" type="search" defaultValue={params.q || ""} placeholder="Title, description, folder or tag" /></label>
            <label>Media type<select name="type" defaultValue={type}><option value="all">All types</option><option value="video">Uploaded videos</option><option value="youtube">YouTube</option><option value="podcast">Podcasts</option><option value="speaking">Speaking</option></select></label>
            <label>Status<select name="status" defaultValue={status}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option></select></label>
            <button className="button primary" type="submit">Apply filters</button>
            {(query || type !== "all" || status !== "all") && <a className="button secondary" href="/administration/media?tab=library">Clear</a>}
          </form>

          {!databaseAvailable ? (
            <div className="media-empty-library"><h2>Library unavailable</h2><p>Connect the local content database to load saved media.</p></div>
          ) : filtered.length ? (
            <div className="media-library-list">
              {filtered.map((item) => {
                const placements = savedMediaSections(item.sections);
                return (
                  <article className="media-library-item" key={item.id}>
                    <details id={`lesson-${item.id}`}>
                      <summary>
                        <span className={`media-status ${item.status}`}>{item.status}</span>
                        <span className="media-library-title"><strong>{item.title}</strong><small>{contentLabels[item.contentKind] || item.contentKind} · {item.level} · {item.category}</small></span>
                        <span className="media-placement-count">{placements.length || 1} placement{(placements.length || 1) === 1 ? "" : "s"}</span>
                      </summary>
                      <div className="media-library-details">
                        <p>{item.description || "No description has been added."}</p>
                        <div className="media-placement-list"><strong>Used in</strong>{placements.length ? placements.map((section) => <span key={section}>{mediaSections[section]}</span>) : <span>Original section</span>}</div>
                        <div className="admin-actions">
                          <a className="button secondary" href={item.contentKind === "podcast" ? `/podcasts/${item.id}` : `/video-lessons/${item.id}`}>Preview lesson</a>
                        </div>
                        <VideoEditor id={item.id} initial={item.transcript} status={item.status} category={item.category} categories={categories} contentKind={item.contentKind} title={item.title} description={item.description} level={item.level} displayFormat={item.displayFormat} sourceUrl={item.sourceUrl} thumbnailKey={item.thumbnailKey} thumbnailSource={item.thumbnailSource} thumbnailSettings={item.thumbnailSettings} hasTranscriptionSource={!!item.transcriptionKey} sections={item.sections} mimeType={item.mimeType} />
                      </div>
                    </details>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="media-empty-library"><h2>No matching media</h2><p>Change the filters or create your first lesson.</p><a className="button primary" href="/administration/media?tab=create">Create lesson</a></div>
          )}
        </div>
      )}
    </section>
  );
}