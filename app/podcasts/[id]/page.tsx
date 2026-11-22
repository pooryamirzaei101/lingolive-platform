import {and,eq} from "drizzle-orm";
import {notFound} from "next/navigation";
import {getDb} from "@/db";
import {savedSentences,videoLessons} from "@/db/schema";
import {isAdmin} from "@/lib/admin";
import {canLearn} from "@/lib/membership";
import {MembershipLock} from "@/components/membership-lock";
import {PodcastPlayer} from "@/components/podcast-player";
import {YouTubeLearningLesson} from "@/components/youtube-learning-lesson";
import {parseTranscript} from "@/lib/video";
import {getChatGPTUser} from "@/app/chatgpt-auth";
import {preferredLanguage} from "@/lib/translation-service";
export const dynamic="force-dynamic";
export default async function Podcast({params}:{params:Promise<{id:string}>}){
  const {id}=await params,lesson=await getDb().select().from(videoLessons).where(eq(videoLessons.id,id)).get();
  if(!lesson||lesson.contentKind!=="podcast"||(lesson.status!=="published"&&!await isAdmin()))notFound();
  if(!await canLearn("video",id))return <MembershipLock/>;
  const user=await getChatGPTUser(),language=user?await preferredLanguage(user.userId):"fa",saved=user?await getDb().select({start:savedSentences.start}).from(savedSentences).where(and(eq(savedSentences.userId,user.userId),eq(savedSentences.lessonId,id))).all():[],lines=parseTranscript(lesson.transcript);
  return <section className="section shell catalog-page"><a href="/podcasts" className="folder-back">← Podcasts</a><span className="section-eyebrow">PODCAST · {lesson.sourceUrl?"YOUTUBE":lesson.mimeType.startsWith("audio/")?"AUDIO":"VIDEO"} {lesson.status==="draft"?"· DRAFT PREVIEW":""}</span><h1>{lesson.title}</h1><p>{lesson.description}</p>
    {lesson.sourceUrl?<YouTubeLearningLesson id={id} url={lesson.sourceUrl} lines={lines} title={lesson.title} signedIn={!!user} initiallySaved={saved.map(row=>row.start)} initialLanguage={language} vertical={lesson.displayFormat==="vertical"} thumbnail={lesson.thumbnailKey?`/api/video-lessons/${id}/thumbnail?k=${encodeURIComponent(lesson.thumbnailKey)}`:undefined}/>:<PodcastPlayer id={id} lines={lines} audio={lesson.mimeType.startsWith("audio/")} initialLanguage={language} signedIn={!!user} initiallySaved={saved.map(row=>row.start)}/>}
  </section>;
}