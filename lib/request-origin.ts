function parsedOrigin(value:string){
 try{
  const url=new URL(value);
  if(url.protocol!=='http:'&&url.protocol!=='https:')return null;
  return url;
 }catch{return null}
}

function loopback(hostname:string){
 const host=hostname.replace(/^\[|\]$/g,'').toLowerCase();
 return host==='localhost'||host==='127.0.0.1'||host==='::1';
}

function equivalent(left:URL,right:URL){
 if(left.origin===right.origin)return true;
 return loopback(left.hostname)&&loopback(right.hostname)&&left.protocol===right.protocol&&left.port===right.port;
}

export function sameRequestOrigin(request:Request){
 const supplied=parsedOrigin(request.headers.get('origin')||'');
 if(!supplied)return false;
 const candidates=[new URL(request.url),process.env.APP_ORIGIN&&parsedOrigin(process.env.APP_ORIGIN)].filter(Boolean) as URL[];
 return candidates.some(candidate=>equivalent(supplied,candidate));
}
