import {eq,desc} from "drizzle-orm";
import {redirect} from "next/navigation";
import {getDb} from "@/db";
import {videoLessons} from "@/db/schema";
import {isAdmin} from "@/lib/admin";
import {getVideoCategories} from "@/lib/video-categories";
import {CategoryManager,VideoEditor,VideoUpload} from "@/components/video-admin";
export const dynamic="force-dynamic";
export default async function PodcastStudio(){
  if(!await isAdmin())redirect("/login");
  const [items,categories]=await Promise.all([
    getDb().select().from(videoLessons).where(eq(videoLessons.contentKind,"podcast")).orderBy(desc(videoLessons.createdAt)).all(),
    getVideoCategories("podcast")
  ]);
  return <section className="section shell admin-page podcast-studio">
    <a className="folder-back" href="/administration">← Administration</a>
    <span className="section-eyebrow">ADMINISTRATION</span><h1>Podcasts studio</h1>
    <p>Create folders and subfolders, add a YouTube podcast or upload audio/video, prepare English and translated subtitles, save a draft, review sentence boxes, then publish.</p>
    <p><a className="button secondary" href="/administration/media-apis">Transcription & translation API settings</a></p>
    <CategoryManager categories={categories} section="podcast" />
    <div className="detail-grid"><div className="detail-panel"><h2>Podcast drafts and lessons</h2>
      {items.map(item=><article className="admin-lesson" key={item.id}><details open={item.status==="draft"}><summary><strong>{item.title}</strong> · {item.status} · {item.sourceUrl?"YouTube":item.mimeType.startsWith("audio/")?"audio upload":"video upload"}</summary><a href={`/podcasts/${item.id}`}>Preview podcast</a><VideoEditor id={item.id} initial={item.transcript} status={item.status} category={item.category} categories={categories} contentKind="podcast" title={item.title} description={item.description} level={item.level} displayFormat={item.displayFormat} sourceUrl={item.sourceUrl} thumbnailKey={item.thumbnailKey} thumbnailSource={item.thumbnailSource} thumbnailSettings={item.thumbnailSettings} hasTranscriptionSource={!!item.transcriptionKey} sections={item.sections} mimeType={item.mimeType}/></details></article>)}
      {!items.length&&<p>No podcasts yet.</p>}
    </div><aside className="detail-panel" id="add-podcast"><h2>Add podcast</h2><VideoUpload categories={categories} initialSection="podcast" lockedSection /></aside></div>
  </section>;
}