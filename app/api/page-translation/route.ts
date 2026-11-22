import {getChatGPTUser} from "@/app/chatgpt-auth";
import {cachedTranslation} from "@/lib/translation-cache";
import {isTranslationLanguage} from "@/lib/languages";

export async function POST(request:Request){
 const user=await getChatGPTUser();
 if(!user)return Response.json({error:"Sign in to translate a full page."},{status:401});
 if(request.headers.get("origin")&&request.headers.get("origin")!==new URL(request.url).origin)return Response.json({error:"Invalid request origin."},{status:403});
 try{
  const body=await request.json() as {text?:unknown;language?:unknown};
  const text=typeof body.text==="string"?body.text.replace(/\r/g,"").trim():"";
  if(!text||text.length>9000)return Response.json({error:"This page has too much text to translate at once."},{status:400});
  if(!isTranslationLanguage(body.language))return Response.json({error:"Choose a supported language."},{status:400});
  const result=await cachedTranslation(text,body.language,user.userId);
  return Response.json({language:body.language,...result},{headers:{"Cache-Control":"no-store"}});
 }catch(error){return Response.json({error:error instanceof Error?error.message:"Translation is temporarily unavailable."},{status:503})}
}