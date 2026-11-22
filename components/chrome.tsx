import { Menu, House, Clapperboard, CalendarDays, Layers3, Newspaper, LibraryBig, Mic2, Lightbulb, NotebookTabs, Headphones, GraduationCap, Bookmark, Trophy, Crown, UserRoundPlus, LifeBuoy, Settings, Shield, LayoutDashboard, Users, SquarePlay } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { getChatGPTUser } from "@/app/chatgpt-auth";

const navigation=[
  {label:"Home",href:"/",icon:House},
  {label:"Video Lessons",href:"/video-lessons",icon:Clapperboard},
  {label:"News",href:"/news",icon:Newspaper},
  {label:"Daily Lessons",href:"/daily-lessons",icon:CalendarDays},
  {label:"YouTube Lessons",href:"/youtube-videos",icon:SquarePlay},
  {label:"Flashcards",href:"/flashcards",icon:Layers3},
  {label:"Podcasts",href:"/podcasts",icon:Headphones},

  {label:"IELTS Video Speaking",href:"/ielts-video-speaking",icon:GraduationCap},
  {label:"Reading Room",href:"/reading-room",icon:LibraryBig},
  {label:"Speaking Practice",href:"/speaking-practice",icon:Mic2},
  {label:"Quick Tips",href:"/quick-tips",icon:Lightbulb},
  {label:"Word Bank",href:"/word-bank",icon:NotebookTabs},
  {label:"My Collection",href:"/my-collection",icon:Bookmark},
  {label:"Achievements",href:"/achievements",icon:Trophy},
  {label:"Membership",href:"/premium",icon:Crown},
  {label:"Invite Friends",href:"/invite-friends",icon:UserRoundPlus},
  {label:"Contact Admin",href:"/support",icon:LifeBuoy},
  {label:"Settings",href:"/settings",icon:Settings},
];
function LogoMark(){return <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 9.5A5.5 5.5 0 0 1 12.5 4H20v27H12.5A5.5 5.5 0 0 0 7 36.5v-27Z"/><path d="M33 9.5A5.5 5.5 0 0 0 27.5 4H20v27h7.5a5.5 5.5 0 0 1 5.5 5.5v-27Z"/><path className="logo-spark" d="m20 10 1.8 3.8L26 15.5l-4.2 1.7L20 21l-1.8-3.8-4.2-1.7 4.2-1.7L20 10Z"/></svg>}
function Brand(){return <a href="/" className="brand" aria-label="LingoLive home"><span className="brand-icon"><LogoMark/></span><span className="brand-word">Lingo<span>Live</span></span></a>}
function NavLinks({admin}:{admin:boolean}){return <><span className="side-group">LEARN & PRACTICE</span>{navigation.map(({label,href,icon:Icon})=><a className="side-link" href={href} key={href}><Icon size={18}/>{label}</a>)}<span className="side-group">YOUR SPACE</span><a className="side-link" href="/dashboard"><LayoutDashboard size={18}/> Dashboard</a>{admin&&<><a className="side-link" href="/administration"><Shield size={18}/> Administration</a><a className="side-link" href="/administration/users"><Users size={18}/> Users</a><a className="side-link" href="/administration/support"><LifeBuoy size={18}/> Support inbox</a></>}</>}
export async function Header(){const [admin,user]=await Promise.all([isAdmin(),getChatGPTUser()]),accountHref=user?'/account':'/login';return <><aside className="site-sidebar"><div className="side-brand"><Brand/></div><nav aria-label="Main navigation" className="side-scroll"><NavLinks admin={admin}/></nav><div className="side-bottom"><a href={accountHref}>{user?"Account":"Sign in / Register"}</a></div></aside><header className="site-header app-topbar"><div className="shell nav-row"><details className="mobile-nav"><summary aria-label="Open menu"><Menu size={24}/></summary><nav aria-label="Mobile navigation"><NavLinks admin={admin}/><a className="side-link" href={accountHref}>{user?"Account":"Sign in / Register"}</a></nav></details><div className="mobile-brand"><Brand/></div><span className="topbar-note">Your learning space</span><a className="button secondary topbar-action" href={accountHref}>{user?"My account":"Sign in / Register"}</a></div></header></>}
export function Footer(){return <footer className="site-footer"><div className="shell footer-bottom"><span>© {new Date().getFullYear()} LingoLive</span><span>Learn at your own pace.</span></div></footer>}
