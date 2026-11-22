import { AdminSamples } from "@/components/admin-samples";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { videoLessons } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { getVideoCategories } from "@/lib/video-categories";
import { CategoryManager } from "@/components/video-admin";
import { SpeakingVideoEditor, SpeakingYouTubeAdmin } from "@/components/speaking-youtube-admin";
export const dynamic="force-dynamic";
export default async function SpeakingAdministration(){
 if(!await isAdmin())return <section className="section shell"><h1>Administration</h1><p>This area is available only to the site administrator.</p><a href="/">Go home</a></section>;
 try{
  const [categories,lessons]=await Promise.all([getVideoCategories("speaking"),getDb().select().from(videoLessons).where(eq(videoLessons.contentKind,"speaking")).orderBy(desc(videoLessons.createdAt)).all()]);
  return <section className="section shell admin-page"><a href="/administration" className="folder-back">← Administration</a><span className="section-eyebrow">ADMINISTRATION</span><h1>Speaking Practice studio</h1><p>Create folders, add a YouTube or hosted video, and enter only its title and description. After publishing, learners can watch, record their voice, and replay recordings whenever they want.</p><CategoryManager categories={categories} section="speaking"/><div className="detail-grid"><div className="detail-panel"><h2>Speaking videos</h2>{lessons.length?lessons.map((lesson:typeof videoLessons.$inferSelect)=><article className="admin-lesson" id={`lesson-${lesson.id}`} key={lesson.id}><div><strong>{lesson.title}</strong><small>{categories.find(category=>category.id===lesson.category)?.name||lesson.category} · {lesson.status}</small></div><SpeakingVideoEditor lesson={lesson} categories={categories}/></article>):<p>No speaking videos yet.</p>}</div><aside className="detail-panel" id="add-content"><h2>Add speaking video</h2><p>Choose YouTube to preserve the original player quality, or upload an MP4/WebM video to the host.</p><SpeakingYouTubeAdmin categories={categories}/></aside></div><AdminSamples section="speaking"/></section>
 }catch{return <section className="section shell"><h1>Speaking Practice studio</h1><p className="notice">The speaking content database is temporarily unavailable. Please try again later.</p></section>}
}