import {canLearn} from "@/lib/membership";
import {MembershipLock} from "@/components/membership-lock";
import Link from "next/link";
import {notFound} from "next/navigation";
import {and,eq} from "drizzle-orm";
import {getChatGPTUser} from "@/app/chatgpt-auth";
import {getDb} from "@/db";
import {savedRoutines} from "@/db/schema";
import {isAdmin} from "@/lib/admin";
import {getRoutine} from "@/lib/routines";
import {RoutineSaveButton} from "@/components/routine-save-button";
import {DailyLessonContent} from "@/components/daily-lesson-content";
export const dynamic="force-dynamic";
export default async function RoutineDetail({params}:{params:Promise<{id:string}>}){const {id}=await params,[admin,user]=await Promise.all([isAdmin(),getChatGPTUser()]),[lesson,savedRow]=await Promise.all([getRoutine(id,admin),user?getDb().select({id:savedRoutines.id}).from(savedRoutines).where(and(eq(savedRoutines.userId,user.userId),eq(savedRoutines.lessonId,id))).get():null]);if(!lesson)notFound();const saved=!!savedRow;if(lesson.status!=="published"&&!saved&&!admin)notFound();if(!await canLearn("routine",id))return <MembershipLock/>;return <section className="section shell routine-lesson"><Link className="folder-back" href="/daily-lessons/routines">← Daily Lessons</Link><span className="section-eyebrow">DAILY LESSON {lesson.status==="draft"?"· ADMIN PREVIEW":""}</span><h1>{lesson.title}</h1><DailyLessonContent lesson={{...lesson,...(()=>{try{return JSON.parse(lesson.body||"{}")}catch{return {}}})()}}/><RoutineSaveButton lessonId={lesson.id} initial={saved} signedIn={!!user}/></section>}