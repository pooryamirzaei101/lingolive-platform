import { AuthForm } from "../auth-form";
export default function LoginPage() { return <main className="form-page"><div className="eyebrow">Welcome back</div><h1 style={{fontSize:"3.5rem"}}>Sign in</h1><p className="lead">Continue your lessons, saved words, and progress.</p><div className="card"><AuthForm mode="login"/></div></main>; }
