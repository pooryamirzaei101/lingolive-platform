import {LockKeyhole} from 'lucide-react';
import {chatGPTSignInPath,getChatGPTUser} from '@/app/chatgpt-auth';
export async function MembershipLock(){
 const user=await getChatGPTUser();
 return <section className="section shell"><div className="empty-state"><LockKeyhole size={32}/><h1>{user?'Premium membership required':'Sign in to open this lesson'}</h1><p>{user?'Complete payment or ask the administrator to activate Premium for your account.':'Create an account or sign in first. After signing in, choose a membership and complete payment to unlock lessons.'}</p><p>Your saved words, sentences, and progress stay safe.</p><a href={user?'/premium':chatGPTSignInPath('/premium')} className="button primary">{user?'View payment options':'Sign in first'}</a></div></section>
}