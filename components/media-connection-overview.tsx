"use client";
import {useEffect,useState} from "react";
import {CheckCircle2,AlertTriangle,RefreshCw,Mic2,Languages,MonitorPlay,Zap} from "lucide-react";
import {translationProviders} from "@/lib/translation-providers";
type State={enabled:boolean;transcriptionProvider:string;transcriptionConnected:boolean;translationProvider:keyof typeof translationProviders;translationConnected:boolean;youtubeConfigured:boolean;youtubeConnected:boolean};
const initial:State={enabled:false,transcriptionProvider:"assembly",transcriptionConnected:false,translationProvider:"deepl",translationConnected:false,youtubeConfigured:false,youtubeConnected:false};
export function MediaConnectionOverview(){
 const [state,setState]=useState(initial),[loading,setLoading]=useState(true),[message,setMessage]=useState("");
 async function load(){setLoading(true);setMessage("");try{const response=await fetch("/api/admin/media-integrations",{cache:"no-store"}),data=await response.json() as State&{error?:string};if(!response.ok)throw Error(data.error||"Could not load connection status.");setState(data)}catch(error){setMessage(error instanceof Error?error.message:"Could not load status.")}finally{setLoading(false)}}
 useEffect(()=>{const refresh=()=>load();refresh();window.addEventListener("media-providers-updated",refresh);return()=>window.removeEventListener("media-providers-updated",refresh)},[]);
 const cards=[
  {label:"API generation",value:state.enabled?"Enabled":"Disabled",ready:state.enabled,icon:<Zap size={21}/>,help:state.enabled?"Draft generation is allowed.":"Manual text and SRT still work."},
  {label:"English transcription",value:state.transcriptionProvider==="assembly"?"AssemblyAI":state.transcriptionProvider==="openai"?"OpenAI-compatible":"Custom API",ready:state.transcriptionConnected,icon:<Mic2 size={21}/>,help:state.transcriptionConnected?"Credential is saved.":"Save and test a transcription credential."},
  {label:"Translation",value:translationProviders[state.translationProvider]||"Translation API",ready:state.translationConnected,icon:<Languages size={21}/>,help:state.translationConnected?"Credential is saved.":"Save and test a translation credential."},
  {label:"YouTube captions",value:state.youtubeConnected?"Connected":state.youtubeConfigured?"Authorization needed":"Not configured",ready:state.youtubeConnected,icon:<MonitorPlay size={21}/>,help:state.youtubeConnected?"Caption import is available.":state.youtubeConfigured?"Connect the Google account below.":"Optional for channel caption import."}
 ];
 const generationReady=state.enabled&&state.transcriptionConnected&&state.translationConnected;
 return <section className="media-connection-overview" aria-labelledby="connection-status-title"><div className="connection-overview-head"><div><span className="section-eyebrow">CONNECTION STATUS</span><h2 id="connection-status-title">Media generation readiness</h2></div><button type="button" className="button secondary" disabled={loading} onClick={load}><RefreshCw size={16}/>{loading?" Checkingâ€¦":" Refresh"}</button></div>
  <div className="connection-status-grid">{cards.map(card=><article className={`connection-status-card ${card.ready?"ready":"attention"}`} key={card.label}><span className="connection-status-icon">{card.icon}</span><div><small>{card.label}</small><strong>{card.value}</strong><p>{card.help}</p></div>{card.ready?<CheckCircle2 size={20}/>:<AlertTriangle size={20}/>}</article>)}</div>
  <div className={`connection-readiness ${generationReady?"ready":"attention"}`}>{generationReady?<CheckCircle2 size={20}/>:<AlertTriangle size={20}/>}<p><strong>{generationReady?"Core media APIs are ready.":"Setup is not complete yet."}</strong> {generationReady?"You can generate English transcripts and translations in draft lessons.":"Complete the numbered sections below. You can always continue with manual sentence boxes and SRT files."}</p></div>
  {message&&<p role="alert" className="notice">{message}</p>}
 </section>;
}