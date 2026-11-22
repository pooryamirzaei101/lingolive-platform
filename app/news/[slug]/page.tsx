import {eq} from "drizzle-orm";
import {notFound} from "next/navigation";
import {getDb} from "@/db";
import {newsPosts} from "@/db/schema";
import {isAdmin} from "@/lib/admin";
import {NewsLearningArticle} from "@/components/news-learning-article";

export const dynamic="force-dynamic";

export default async function Page({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params;
  const post=await getDb().select().from(newsPosts).where(eq(newsPosts.id,slug)).get();
  if(!post||(post.status!=="published"&&!await isAdmin()))notFound();
  return <article className="section shell news-article">
    <a className="folder-back" href="/news">← News</a>
    {post.coverImageUrl&&<img className="news-cover" src={post.coverImageUrl} alt=""/>}
    <span className={`media-status ${post.status}`}>{post.status}</span>
    <span className="section-eyebrow">{post.linkedContentId?"VIDEO NEWS LESSON":"INTERACTIVE READING LESSON"}</span>
    <h1>{post.title}</h1>
    <NewsLearningArticle description={post.description} body={post.body}/>
    {post.linkedContentId&&<div className="detail-panel"><h2>Continue with the video lesson</h2><p>The video transcript is also interactive: tap a word for translation and save it to your Word Bank.</p><a className="button primary" href={`/video-lessons/${post.linkedContentId}`}>Open video and transcript</a></div>}
  </article>;
}
