import {notFound} from "next/navigation";
import {getFlashcard} from "@/lib/flashcards";
import {isAdmin} from "@/lib/admin";
import {canLearn} from "@/lib/membership";
import {MembershipLock} from "@/components/membership-lock";
import {FlashcardStudyCard} from "@/components/flashcard-study-card";
export const dynamic="force-dynamic";
export default async function FlashcardPage({params}:{params:Promise<{id:string}>}){const {id}=await params;let card;try{card=await getFlashcard(id,await isAdmin())}catch{notFound()}if(!card)notFound();if(!await canLearn("flashcards",id))return <MembershipLock/>;return <section className="section shell flashcard-lesson"><a className="folder-back" href="/flashcards">← Flashcards</a><FlashcardStudyCard card={card}/></section>}