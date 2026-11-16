import { AuthForm } from "../auth-form";
export default function RegisterPage() { return <main className="form-page"><div className="eyebrow">Start learning</div><h1 style={{fontSize:"3.5rem"}}>Create an account</h1><p className="lead">Verify your email, choose a plan, and unlock every lesson.</p><div className="card"><AuthForm mode="register"/></div></main>; }
