import { desc, eq, inArray, sql } from "drizzle-orm";
import { getDb, getMediaBucket } from "@/db";
import { learnerProfiles, newsletterAttachments, newsletterRecipients, newsletters, userAdminAudit } from "@/db/schema";
import { isAdmin } from "@/lib/admin";
import { getChatGPTUser } from "@/app/chatgpt-auth";

const allowed = new Set(["application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","image/png","image/jpeg","application/zip","application/x-zip-compressed"]);
const cleanName=(value:string)=>value.replace(/[^a-zA-Z0-9._ -]/g,"_").slice(0,160)||"attachment";
async function actor(request:Request){const user=await getChatGPTUser();if(user)return user;const hostname=new URL(request.url).hostname.toLowerCase(),loopback=hostname==="localhost"||hostname==="127.0.0.1"||hostname==="[::1]";if(process.env.LOCAL_ADMIN_MODE==="true"&&loopback)return {userId:"local-super-admin",email:process.env.ADMIN_EMAIL||"pooryamirzaei101@gmail.com",displayName:"Local Super Admin"};return null}
function sameOrigin(request:Request){const origin=request.headers.get("origin");return !origin||origin===new URL(request.url).origin}

export async function GET(){
 if(!await isAdmin())return Response.json({error:"Administrator access required."},{status:403});
 try{const db=getDb();const history=await db.select().from(newsletters).orderBy(desc(newsletters.createdAt)).limit(50).all();const attachments=await db.select().from(newsletterAttachments).orderBy(desc(newsletterAttachments.createdAt)).limit(250).all();return Response.json({history:history.map((item:any)=>({...item,attachments:attachments.filter((file:any)=>file.newsletterId===item.id)}))},{headers:{"Cache-Control":"private, no-store"}})}catch(error){console.error("Newsletter history failed",error);return Response.json({error:"Newsletter history is temporarily unavailable."},{status:503})}
}

export async function POST(request:Request){
 if(!await isAdmin())return Response.json({error:"Administrator access required."},{status:403});
 if(!sameOrigin(request))return Response.json({error:"Invalid request origin."},{status:403});
 const admin=await actor(request);if(!admin)return Response.json({error:"Sign in as the administrator."},{status:401});
 const db=getDb(),now=Date.now();
 try{
  const latest=await db.select({createdAt:newsletters.createdAt}).from(newsletters).orderBy(desc(newsletters.createdAt)).limit(1).get();
  if(latest&&now-latest.createdAt<60000)return Response.json({error:"Please wait one minute before sending another newsletter."},{status:429});
  const form=await request.formData(),subject=String(form.get("subject")||"").trim(),body=String(form.get("body")||"").trim();
  if(!subject||subject.length>150||!body||body.length>20000)return Response.json({error:"Enter a subject up to 150 characters and a message up to 20,000 characters."},{status:400});
  let selected:string[]=[];try{const raw=JSON.parse(String(form.get("recipientIds")||"[]"));if(Array.isArray(raw))selected=raw.filter(value=>typeof value==="string").slice(0,5000)}catch{return Response.json({error:"Choose valid newsletter recipients."},{status:400})}
  const all=String(form.get("recipientMode")||"all")==="all";
  if(!all&&!selected.length)return Response.json({error:"Select at least one subscribed recipient."},{status:400});
  const recipients=await db.select({userId:learnerProfiles.userId,email:learnerProfiles.email,name:learnerProfiles.displayName}).from(learnerProfiles).where(all?eq(learnerProfiles.newsletterConsent,1):sql`${learnerProfiles.newsletterConsent}=1 AND ${learnerProfiles.userId} IN (${sql.join(selected.map(id=>sql`${id}`),sql`,`)})`).limit(10000).all();
  if(!recipients.length)return Response.json({error:"No subscribed recipients were selected."},{status:400});
  const files=form.getAll("attachments").filter((value):value is File=>typeof value!=="string"&&value.size>0);if(files.length>5)return Response.json({error:"Attach at most five files."},{status:400});
  for(const file of files)if(file.size>10*1024*1024||!allowed.has(file.type))return Response.json({error:`${file.name}: use PDF, DOCX, XLSX, PNG, JPG, or ZIP up to 10 MB.`},{status:400});
  const id=crypto.randomUUID(),stored:{id:string;fileName:string;fileKey:string;fileType:string;fileSize:number;bytes:Uint8Array}[]=[];
  try{for(const file of files){const bytes=new Uint8Array(await file.arrayBuffer()),fileName=cleanName(file.name),fileKey=`newsletters/${id}/${crypto.randomUUID()}-${fileName}`;await getMediaBucket().put(fileKey,bytes,{httpMetadata:{contentType:file.type}});stored.push({id:crypto.randomUUID(),fileName,fileKey,fileType:file.type,fileSize:file.size,bytes})}
   const configured=process.env.LOCAL_ADMIN_MODE!=="true"&&Boolean(process.env.RESEND_API_KEY&&process.env.NEWSLETTER_FROM_EMAIL),deliveryStatus=configured?"sent":"logged-local";
   await db.insert(newsletters).values({id,subject,body,sentBy:admin.userId,recipientCount:recipients.length,status:configured?"sent":"local-test",sentAt:now,createdAt:now});
   for(const file of stored)await db.insert(newsletterAttachments).values({id:file.id,newsletterId:id,fileName:file.fileName,fileKey:file.fileKey,fileType:file.fileType,fileSize:file.fileSize,createdAt:now});
   if(configured){for(const recipient of recipients){const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:process.env.NEWSLETTER_FROM_EMAIL,to:[recipient.email],subject,text:body,attachments:stored.map(file=>({filename:file.fileName,content:Buffer.from(file.bytes).toString("base64")}))})});if(!response.ok)throw Error(`Email provider rejected delivery to ${recipient.email}.`)}}
   for(const recipient of recipients)await db.insert(newsletterRecipients).values({id:crypto.randomUUID(),newsletterId:id,userId:recipient.userId,email:recipient.email,deliveryStatus,deliveredAt:configured?Date.now():null,createdAt:now});
   await db.insert(userAdminAudit).values({id:crypto.randomUUID(),actorId:admin.userId,targetId:id,action:"newsletter_sent",expiresAt:recipients.length,createdAt:now});
   return Response.json({id,message:configured?`Newsletter sent to ${recipients.length} subscribers.`:`Newsletter saved for ${recipients.length} subscribers in local test mode. Configure Resend to deliver email.`,recipientCount:recipients.length,status:configured?"sent":"local-test"},{status:201});
  }catch(error){for(const file of stored)await getMediaBucket().delete(file.fileKey).catch(()=>{});throw error}
 }catch(error){console.error("Newsletter send failed",error);return Response.json({error:error instanceof Error?error.message:"Newsletter could not be sent."},{status:503})}
}