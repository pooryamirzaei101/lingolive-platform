import {mediaResponse} from "@/lib/media-response";
import {canLearn} from "@/lib/membership";
import {getMediaBucket} from "@/db";
import {getFlashcard} from "@/lib/flashcards";
import {isAdmin} from "@/lib/admin";
import {flashcardAudioMeta} from "@/lib/flashcard-audio";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 try{const card=await getFlashcard(id,await isAdmin());if(!card)return new Response("Not found",{status:404});const kind=new URL(request.url).searchParams.get("kind"),meta=flashcardAudioMeta(card.mimeType),key=kind==="example"?meta.exampleAudioKey:kind==="explanation"?meta.explanationAudioKey:card.audioKey,mime=kind==="example"?meta.exampleMime:kind==="explanation"?meta.explanationMime:meta.phraseMime;if(!key)return new Response("Not found",{status:404});if(!await canLearn("flashcards",id))return new Response("Membership required",{status:403});return mediaResponse(getMediaBucket(),key,mime,request)}catch{return new Response("Audio unavailable",{status:503})}
}
export const HEAD=GET;
