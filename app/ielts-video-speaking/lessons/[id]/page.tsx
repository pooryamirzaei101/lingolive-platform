import {and,eq} from 'drizzle-orm';
import {notFound} from 'next/navigation';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {MembershipLock} from '@/components/membership-lock';
import {AudioTranscriptStudio} from '@/components/audio-transcript-studio';
import {VideoLearningPlayer} from '@/components/video-learning-player';
import {YouTubeLearningLesson} from '@/components/youtube-learning-lesson';
import {getDb} from '@/db';
import {ieltsSpeakingExamples,mediaTranscripts,savedSentences} from '@/db/schema';
import {isAdmin} from '@/lib/admin';
import {canLearn} from '@/lib/membership';
import {preferredLanguage} from '@/lib/translation-service';
import {parseTranscript} from '@/lib/video';

export const dynamic='force-dynamic';

export default async function IeltsVideoLesson({params}:{params:Promise<{id:string}>}){
 const {id}=await params,admin=await isAdmin(),record=await getDb().select().from(ieltsSpeakingExamples).where(eq(ieltsSpeakingExamples.id,id)).get();
 if(!record||record.kind!=='speaking_video'||record.status!=='published'&&!admin)notFound();
 if(!await canLearn('ielts',id))return <MembershipLock/>;
 const user=await getChatGPTUser(),language=user?await preferredLanguage(user.userId):'fa';
 const [stored,saved]=await Promise.all([
  getDb().select().from(mediaTranscripts).where(eq(mediaTranscripts.id,`ielts:${id}`)).get(),
  user?getDb().select({start:savedSentences.start}).from(savedSentences).where(and(eq(savedSentences.userId,user.userId),eq(savedSentences.lessonId,id))).all():Promise.resolve([]),
 ]);
 const lines=parseTranscript(stored?.segments||'[]'),thumbnail=record.thumbnailKey?`/api/ielts-speaking/${id}/asset/thumbnail`:undefined;
 return <section className="section shell catalog-page"><a className="folder-back" href={`/ielts-video-speaking/folders/${record.category}`}>← IELTS Video Speaking Practice</a><span className="section-eyebrow">IELTS VIDEO SPEAKING · {record.status==='draft'?'DRAFT PREVIEW':'LESSON'}</span><h1>{record.question}</h1>{record.description&&<p>{record.description}</p>}{record.videoUrl?<YouTubeLearningLesson id={id} url={record.videoUrl} lines={lines} title={record.question} signedIn={!!user} initiallySaved={saved.map(row=>row.start)} initialLanguage={language} vertical={record.displayFormat==='vertical'} thumbnail={thumbnail}/>:<VideoLearningPlayer id={id} lines={lines} src={`/api/ielts-speaking/${id}/video`} signedIn={!!user} initiallySaved={saved.map(row=>row.start)} initialLanguage={language} tapForMeaning vertical={record.displayFormat==='vertical'} thumbnail={thumbnail}/>}{admin&&<aside className="detail-panel admin-preview-editor"><span className="section-eyebrow">ADMIN PREVIEW EDITOR</span><h2>Edit English and translation sentence boxes</h2><p>Edit every English sentence, translation, start time, and end time below. Select Save transcript to update this preview.</p><AudioTranscriptStudio section="ielts" id={id}/></aside>}</section>;
}