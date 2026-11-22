import {and,eq} from 'drizzle-orm';
import {cache} from 'react';
import {getDb} from '@/db';
import {memberships,premiumGrants,referralEntitlements,paymentSettings} from '@/db/schema';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {isAdmin} from '@/lib/admin';
import {defaultPrices,isMembershipActive} from '@/lib/payment-rules';
import {lessons} from '@/lib/content';
import {videoExample,newsExample,speakingVideoExample} from '@/lib/video-example';
import {readingExamples} from '@/lib/reading-examples';
import {ieltsSamples} from '@/lib/ielts-speaking';
import {sampleTips} from '@/lib/quick-tips';
export const prices=cache(async function prices(){
 const db=getDb();let row=await db.select().from(paymentSettings).where(eq(paymentSettings.id,'main')).get();
 // Apply the owner's confirmed annual-price change once; later administrator edits remain authoritative.
 if(row&&row.pricingRevision===0){await db.update(paymentSettings).set({iranAnnual:defaultPrices.iranAnnual,pricingRevision:1}).where(and(eq(paymentSettings.id,'main'),eq(paymentSettings.pricingRevision,0)));row=await db.select().from(paymentSettings).where(eq(paymentSettings.id,'main')).get()}
 return row||{id:'main',pricingRevision:1,...defaultPrices,iranProvider:'zarinpal',merchantKey:'',zibalMerchant:'',internationalProvider:'stripe',stripeKey:'',webhookKey:'',paypalClientId:'',paypalSecret:'',paypalMode:'sandbox',iranManualEnabled:0,iranCardHolder:'',iranCardNumber:'',iranCardImage:'',iranInstructions:'',cryptoEnabled:0,cryptoMonthly:0,cryptoAnnual:0,cryptoCurrency:'USDT',cryptoNetwork:'TRC20',cryptoWallet:'',cryptoInstructions:'',internationalManualEnabled:0,internationalCardHolder:'Poorya Mirzaei',internationalCardNumber:'',internationalCardImage:'',internationalInstructions:'',internationalBankOneName:'Ziraat BankasÄ±',internationalBankOneIban:'',internationalBankTwoName:'VakÄ±fBank',internationalBankTwoIban:''};
});
export const membership=cache(async function membership(userId:string){const db=getDb(),[paid,grant,referral]=await Promise.all([db.select().from(memberships).where(eq(memberships.userId,userId)).get(),db.select().from(premiumGrants).where(eq(premiumGrants.userId,userId)).get(),db.select().from(referralEntitlements).where(eq(referralEntitlements.userId,userId)).get()]);if(!paid&&!grant&&!referral)return undefined;return {userId,expiresAt:Math.max(paid?.expiresAt||0,grant?.expiresAt||0,referral?.expiresAt||0),subscriptionId:paid?.subscriptionId||null,customerId:paid?.customerId||null,paidExpiresAt:paid?.expiresAt||0,grantedExpiresAt:grant?.expiresAt||0,referralExpiresAt:referral?.expiresAt||0}});
export function defaultFree(section:string,id:string){if(section==='lesson')return lessons.some(l=>l.slug===id&&l.status==='Free');if(section==='video')return [videoExample,newsExample,speakingVideoExample].some(l=>l.id===id);if(section==='routine')return id==='morning-routine';if(section==='ielts')return id==='sample-reading'||ieltsSamples.some(l=>l.id===id);if(section==='tips')return sampleTips.some(l=>l.id===id);if(section==='reading')return readingExamples.some(l=>l.id===id||l.chapters.some(c=>c.id===id));return false}
export const canLearn=cache(async function canLearn(_section:string,_id:string){
 if(await isAdmin())return true;
 const user=await getChatGPTUser();
 return !!user&&isMembershipActive((await membership(user.userId))?.expiresAt);
});
export async function canLearnMany(_section:string,ids:string[]){
 const unique=[...new Set(ids)];
 if(!unique.length)return new Set<string>();
 if(await isAdmin())return new Set(unique);
 const user=await getChatGPTUser();
 return user&&isMembershipActive((await membership(user.userId))?.expiresAt)?new Set(unique):new Set<string>();
}
