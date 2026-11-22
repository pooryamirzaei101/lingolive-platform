import type {VideoCategory} from '@/lib/video';

export type IeltsMode='video'|'listening';
export const ieltsTitle=(_mode:IeltsMode)=>'IELTS Video Speaking Practice';
export const ieltsBase=(_mode:IeltsMode)=>'/ielts-video-speaking';
export function ieltsFolders(categories:VideoCategory[],_mode:IeltsMode){
 const roots=['ielts-video-speaking','ielts-speaking'];
 const byId=new Map(categories.map(c=>[c.id,c]));
 return categories.filter(category=>{
  let current:VideoCategory|undefined=category;
  for(let i=0;current&&i<=categories.length;i++){
   if(roots.includes(current.id))return true;
   current=current.parentId?byId.get(current.parentId):undefined;
  }
  return false;
 });
}