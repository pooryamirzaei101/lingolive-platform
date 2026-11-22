import type { TranscriptSegment } from "@/lib/video";
export function validateSegments(value:unknown):TranscriptSegment[]{
  if(!Array.isArray(value)||value.length>5000)throw new Error("Use up to 5,000 subtitle sentences.");
  let previous=-1;
  return value.map((s:any)=>{if(!s||!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end<=s.start||s.start<previous||typeof s.english!=="string"||!s.english.trim()||s.english.length>4000)throw new Error("Check every sentence's start, end, and English text. Keep sentences in time order.");previous=s.start;const translations:Record<string,string>={};for(const [lang,text] of Object.entries(s.translations||{})){if(typeof text!=="string"||text.length>4000)throw new Error("Translation text is too long.");translations[lang]=text.trim()}const words=Array.isArray(s.words)?s.words.map((w:any)=>{if(!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<s.start-.1||w.end>s.end+.1||w.end<=w.start||typeof w.text!=="string"||!w.text.trim()||w.text.length>100)throw new Error("Check the word timestamps and text.");return {start:w.start,end:w.end,text:w.text.trim()}}):undefined;return {start:s.start,end:s.end,english:s.english.trim(),translations,...(words?.length?{words}:{})}});
}
export function parseSrt(text:string):{start:number;end:number;text:string}[]{
  const blocks=text.replace(/^\uFEFF/,"").replace(/\r/g,"").trim().split(/\n\s*\n/);
  const time=(s:string)=>{const m=/^(\d+):(\d{2}):(\d{2})[,.](\d{3})$/.exec(s);if(!m||+m[2]>59||+m[3]>59)throw new Error("Invalid SRT timestamp.");return +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000};
  const rows=blocks.map(b=>{const lines=b.split("\n");if(/^\d+$/.test(lines[0]))lines.shift();const m=/^(\S+)\s*-->\s*(\S+)/.exec(lines.shift()||"");if(!m)throw new Error("Use an SRT file with numbered timestamped subtitle blocks.");const start=time(m[1]),end=time(m[2]),text=lines.join(" ").trim();if(end<=start||!text)throw new Error("Each SRT block needs valid times and text.");return {start,end,text}});
  if(rows.length>5000)throw new Error("SRT file has too many subtitles.");return rows;
}
export function parseVtt(text:string):{start:number;end:number;text:string}[]{
 const blocks=text.replace(/^\uFEFF/,'').replace(/\r/g,'').trim().split(/\n\s*\n/).filter(b=>!/^WEBVTT|^NOTE/.test(b.trim()));
 const time=(value:string)=>{const m=/^(?:(\d+):)?(\d{2}):(\d{2})\.(\d{3})$/.exec(value);if(!m||+m[2]>59||+m[3]>59)throw Error('Invalid VTT timestamp.');return Number(m[1]||0)*3600+Number(m[2])*60+Number(m[3])+Number(m[4])/1000};
 const rows=blocks.map(block=>{const lines=block.split('\n');if(!lines[0].includes('-->'))lines.shift();const match=/^(\S+)\s*-->\s*(\S+)/.exec(lines.shift()||'');if(!match)throw Error('Use timestamped WebVTT cues.');const start=time(match[1]),end=time(match[2]),content=lines.join(' ').replace(/<[^>]+>/g,'').trim();if(end<=start||!content)throw Error('Each VTT cue needs valid time and text.');return {start,end,text:content}});
 if(!rows.length||rows.length>5000)throw Error('Use a VTT file with 1 to 5,000 cues.');return rows;
}

/** Parse timestamped transcript text copied from transcript tools. */
export function parseTimestampedText(text:string):{start:number;end:number;text:string}[]{
 const normalized=text.replace(/^\uFEFF/,"").replace(/\r/g,"").replace(/([^\n])\s+(?=\[?(?:(?:\d{1,3}:)?\d{1,2}:\d{2}[.,]\d{1,3})\]?)/g,"$1\n");
 const lines=normalized.split("\n"),cues:{start:number;text:string}[]=[];let pending:number|null=null;
 const time=(value:string)=>{const parts=value.trim().replace(/,/g,".").split(":");if(parts.length<2||parts.length>3)return NaN;const seconds=Number(parts.pop()),minutes=Number(parts.pop()),hours=parts.length?Number(parts.pop()):0;return Number.isFinite(seconds)&&Number.isFinite(minutes)&&Number.isFinite(hours)&&minutes<=59&&seconds<60?hours*3600+minutes*60+seconds:NaN};
 for(const raw of lines){const line=raw.trim();if(!line)continue;const match=/^(?:\[)?((?:\d{1,3}:)?\d{1,2}:\d{2}(?:[.,]\d{1,3})?)(?:\])?\s*(?:[-–—>|:]\s*)?(.*)$/.exec(line);if(match){const start=time(match[1]);if(!Number.isFinite(start))throw Error(`Invalid timestamp: ${match[1]}`);const body=match[2].trim();if(body){cues.push({start,text:body});pending=null}else pending=start}else if(pending!==null){cues.push({start:pending,text:line});pending=null}else if(cues.length)cues[cues.length-1].text=`${cues[cues.length-1].text} ${line}`.trim();else throw Error("Start every pasted passage with a timestamp, for example 00:00:01.560.")}
 if(pending!==null)throw Error("The final timestamp needs English text below it.");if(!cues.length)throw Error("Paste at least one timestamped passage.");if(cues.length>5000)throw Error("Use up to 5,000 timestamped passages.");
 return cues.map((cue,index)=>{const end=cues[index+1]?.start??cue.start+3;if(index&&cue.start<cues[index-1].start)throw Error(`Timestamp ${index+1} is earlier than the previous sentence.`);if(end<=cue.start)throw Error(`Sentences ${index+1} and ${index+2} have the same timestamp. Give each sentence a later timestamp.`);return {start:cue.start,end,text:cue.text.trim()}});
}