"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";

type Post={id:string;title:string;description:string;body:string;coverImageUrl:string;linkedContentId:string;status:string;updatedAt:number};
type Lesson={id:string;title:string;status:string};
async function save(body:object){const r=await fetch("/api/admin/news",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)}),d=await r.json() as {error?:string;message?:string};if(!r.ok)throw Error(d.error||"Could not save news.");return d.message||"Saved."}

function PostFields({post,lessons}:{post?:Post;lessons:Lesson[]}){
  const [kind,setKind]=useState<"text"|"video">(post?.linkedContentId?"video":"text");
  return <>
    <label>Lesson type<select value={kind} onChange={event=>setKind(event.target.value as "text"|"video")}><option value="text">Text lesson — interactive article</option><option value="video">Video lesson — article + interactive video transcript</option></select></label>
    <input type="hidden" name="lessonType" value={kind}/>
    <label>Title<input name="title" defaultValue={post?.title} required maxLength={150}/></label>
    <label>Short description<textarea name="description" defaultValue={post?.description} required maxLength={3000} rows={3}/></label>
    <label>English lesson text<textarea name="body" defaultValue={post?.body} required maxLength={50000} rows={post?10:12}/><small>Separate paragraphs with a blank line. Every English word becomes tappable for translation and Word Bank saving.</small></label>
    <label>Cover image URL<input name="coverImageUrl" type="url" defaultValue={post?.coverImageUrl} maxLength={1000}/></label>
    {kind==="video"&&<label>Linked video lesson<select name="linkedContentId" defaultValue={post?.linkedContentId||""} required><option value="">Choose a video lesson</option>{lessons.map(lesson=><option value={lesson.id} key={lesson.id}>{lesson.title} ({lesson.status})</option>)}</select><small>Learners open the video and use its tappable transcript after reading the article.</small></label>}
    {kind==="text"&&<input type="hidden" name="linkedContentId" value=""/>}
    <label>Status<select name="status" defaultValue={post?.status||"draft"}><option value="draft">Draft</option><option value="published">Published</option></select></label>
  </>;
}

export function NewsAdmin({posts,lessons}:{posts:Post[];lessons:Lesson[]}){
  const router=useRouter(),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>,id?:string){event.preventDefault();setBusy(true);try{const data=Object.fromEntries(new FormData(event.currentTarget).entries());setMessage(await save({action:id?"update":"create",id,...data}));if(!id)event.currentTarget.reset();router.refresh()}catch(error){setMessage(error instanceof Error?error.message:"Could not save.")}finally{setBusy(false)}}
  return <div className="detail-grid"><aside className="detail-panel"><h2>Write and share an article</h2><form className="admin-form" onSubmit={event=>submit(event)}><PostFields lessons={lessons}/><button className="button primary" disabled={busy}>{busy?"Saving…":"Save article"}</button></form><p role="status">{message}</p></aside><main className="detail-panel"><h2>Article library</h2>{posts.length?posts.map(post=><details className="admin-lesson" key={post.id}><summary><strong>{post.title}</strong> · {post.linkedContentId?"video":"text"} · {post.status}</summary><form className="admin-form" onSubmit={event=>submit(event,post.id)}><PostFields post={post} lessons={lessons}/><div className="admin-actions"><button className="button primary" disabled={busy}>Save changes</button><a className="button secondary" href={`/news/${post.id}`}>Preview</a><button className="button danger" type="button" disabled={busy} onClick={async()=>{if(confirm(`Delete “${post.title}”?`)){setMessage(await save({action:"delete",id:post.id}));router.refresh()}}}>Delete</button></div></form></details>):<p>No articles yet.</p>}</main></div>;
}
