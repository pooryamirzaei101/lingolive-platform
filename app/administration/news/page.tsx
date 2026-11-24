import {desc,eq} from "drizzle-orm";
import {getDb} from "@/db";
import {newsPosts,videoLessons} from "@/db/schema";
import {isAdmin} from "@/lib/admin";
import {NewsAdmin} from "@/components/news-admin";
import {CategoryManager,VideoEditor,VideoUpload} from "@/components/video-admin";
import {getVideoCategories} from "@/lib/video-categories";
export const dynamic="force-dynamic";
export default async function Page(){
  if(!await isAdmin())return <section className="section shell"><h1>Administrator access required</h1></section>;
  const db=getDb();
  const [posts,allVideos,categories]=await Promise.all([
    db.select().from(newsPosts).orderBy(desc(newsPosts.updatedAt)).all().catch(error=>{console.error("News posts query failed",error);return []}),
    db.select().from(videoLessons).where(eq(videoLessons.contentKind,"video")).orderBy(desc(videoLessons.createdAt)).all().catch(error=>{console.error("News videos query failed",error);return []}),
    getVideoCategories("video").catch(error=>{console.error("News categories query failed",error);return []})
  ]);
  const newsIds=new Set<string>(["news"]);let changed=true;
  while(changed){changed=false;for(const category of categories)if(category.parentId&&newsIds.has(category.parentId)&&!newsIds.has(category.id)){newsIds.add(category.id);changed=true}}
  const newsCategories=categories.filter(category=>newsIds.has(category.id));
  const media=allVideos.filter(item=>newsIds.has(item.category));
  return <section className="section shell admin-page news-media-studio">
    <a className="folder-back" href="/administration">← Administration</a><span className="section-eyebrow">ADMINISTRATION · NEWS</span><h1>News Posts studio</h1>
    <p>Create video news from YouTube or a hosted upload, prepare English and translated subtitles, review the draft sentence boxes, then publish.</p>
    <p><a className="button secondary" href="/administration/media-apis">Transcription & translation API settings</a></p>
    <div className="news-type-grid admin-news-type-grid"><a className="news-type-card video" href="#video-news-studio"><span>VIDEO NEWS STUDIO</span><h2>Add or manage videos</h2><p>Create folders, add YouTube or hosted video, prepare transcripts and publish.</p><strong>Open video studio →</strong></a><a className="news-type-card articles" href="#article-studio"><span>ARTICLE STUDIO</span><h2>Write and share articles</h2><p>Type a news story or article, add a cover, save a draft, preview and publish.</p><strong>Open article studio →</strong></a></div>
    <CategoryManager categories={categories} section="video" rootId="news" />
    <div className="detail-grid" id="video-news-studio"><div className="detail-panel"><h2>Video news drafts and posts</h2>
      {media.map(item=><article className="admin-lesson" key={item.id}><details open={item.status==="draft"}><summary><strong>{item.title}</strong> · {item.status} · {item.sourceUrl?"YouTube":"host upload"}</summary><a href={`/video-lessons/${item.id}`}>Preview news video</a><VideoEditor id={item.id} initial={item.transcript} status={item.status} category={item.category} categories={newsCategories} contentKind="video" title={item.title} description={item.description} level={item.level} displayFormat={item.displayFormat} sourceUrl={item.sourceUrl} thumbnailKey={item.thumbnailKey} thumbnailSource={item.thumbnailSource} thumbnailSettings={item.thumbnailSettings} hasTranscriptionSource={!!item.transcriptionKey} sections={item.sections} mimeType={item.mimeType}/></details></article>)}
      {!media.length&&<p>No video news drafts yet.</p>}
    </div><aside className="detail-panel" id="add-news-video"><h2>Add video news post</h2><VideoUpload categories={newsCategories} initialSection="video" lockedSection studioLabel="news" /></aside></div>
    <details className="detail-panel news-article-manager" id="article-studio" open><summary><strong>Interactive text and video news lessons</strong></summary><p>Choose a text lesson or connect the article to a video lesson. In both formats, learners can tap words for translation and save them to Word Bank.</p><NewsAdmin posts={posts} lessons={allVideos.map(({id,title,status})=>({id,title,status}))}/></details>
  </section>;
}