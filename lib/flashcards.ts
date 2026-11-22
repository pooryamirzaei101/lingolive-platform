import {desc,eq} from "drizzle-orm";
import {getDb} from "@/db";
import {quickTipLessons} from "@/db/schema";
import {getVideoCategories} from "@/lib/video-categories";
export type Flashcard=typeof quickTipLessons.$inferSelect;
export const FLASHCARD_CATEGORY="flashcards-general";
async function flashcardCategoryIds(){
  const categories=await getVideoCategories("flashcards");
  return new Set(["flashcards",FLASHCARD_CATEGORY,...categories.map(category=>category.id)]);
}
export async function listFlashcards(includeDrafts=false){
  const [categoryIds,rows]=await Promise.all([
    flashcardCategoryIds(),
    getDb().select().from(quickTipLessons).orderBy(desc(quickTipLessons.createdAt)).all(),
  ]);
  return rows.filter((card:Flashcard)=>categoryIds.has(card.category)&&(includeDrafts||card.status==="published"));
}
export async function getFlashcard(id:string,includeDraft=false){
  const [categoryIds,card]=await Promise.all([
    flashcardCategoryIds(),
    getDb().select().from(quickTipLessons).where(eq(quickTipLessons.id,id)).get(),
  ]);
  return card&&categoryIds.has(card.category)&&(includeDraft||card.status==="published")?card:undefined;
}