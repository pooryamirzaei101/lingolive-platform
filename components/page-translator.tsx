"use client";
import {useEffect,useState} from "react";
import {Languages,X} from "lucide-react";
import {translationDirection,translationLanguages,type TranslationLanguage} from "@/lib/languages";

export function PageTranslator(){
 const [open,setOpen]=useState(false),[language,setLanguage]=useState<TranslationLanguage>("fa"),[translation,setTranslation]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{if(!open)return;fetch("/api/preferences/translation-language",{cache:"no-store"}).then(r=>r.json()).then(data=>{if(data.language)setLanguage(data.language)}).catch(()=>{})},[open]);
 async function translatePage(){
  const main=document.querySelector("main");
  const text=(main?.textContent||"").split("\n").map(line=>line.trim()).filter(Boolean).filter((line,index,all)=>index===0||line!==all[index-1]).join("\n").slice(0,9000);
  if(!text){setMessage("There is no page text to translate.");return}
  setBusy(true);setMessage("");setTranslation("");
  try{
   const response=await fetch("/api/page-translation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text,language})});
   const data=await response.json() as {translation?:string;error?:string};
   if(!response.ok)throw Error(data.error||"Translation is unavailable.");
   setTranslation(data.translation||"");
  }catch(error){setMessage(error instanceof Error?error.message:"Translation is unavailable.")}finally{setBusy(false)}
 }
 function close(){setOpen(false);setMessage("");setTranslation("")}
 return <div className={`page-translator ${open?"open":""}`}>
  {!open&&<button className="page-translate-trigger" type="button" onClick={()=>setOpen(true)} aria-label="Translate this page"><Languages size={22}/><span>Translate</span></button>}
  {open&&<section className="page-translate-panel" role="dialog" aria-modal="false" aria-labelledby="page-translate-title">
   <header><div><span className="section-eyebrow">PAGE LANGUAGE</span><h2 id="page-translate-title">Translate this page</h2></div><button className="page-translate-close" type="button" onClick={close} aria-label="Close translation"><X size={21}/></button></header>
   <p>Choose a language to read a translation. The original English page stays unchanged.</p>
   <label>Translation language<select value={language} onChange={event=>{setLanguage(event.target.value as TranslationLanguage);setTranslation("");setMessage("")}}>{Object.entries(translationLanguages).map(([code,name])=><option value={code} key={code}>{name}</option>)}</select></label>
   <button className="button primary" type="button" disabled={busy} onClick={translatePage}>{busy?"Translating page…":`Translate into ${translationLanguages[language]}`}</button>
   {translation&&<div className="page-translation-result" lang={language} dir={translationDirection(language)}><strong>{translationLanguages[language]}</strong><p>{translation}</p></div>}
   {message&&<p className="profile-message profile-error" role="status">{message}{message.toLowerCase().includes("sign in")&&<> <a href="/login">Sign in</a></>}</p>}
  </section>}
 </div>
}