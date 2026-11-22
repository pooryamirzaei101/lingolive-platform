import {verifyPaypalOrder} from '@/lib/payments';
export async function GET(request:Request){const url=new URL(request.url);try{await verifyPaypalOrder(url.searchParams.get('order')||'',url.searchParams.get('token')||'');return Response.redirect(`${url.origin}/premium?payment=success`,303)}catch{return Response.redirect(`${url.origin}/premium?payment=unverified`,303)}}
