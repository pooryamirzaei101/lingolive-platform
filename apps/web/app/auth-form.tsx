"use client";
import { FormEvent, useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage("Working…");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/${mode}`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) return setMessage(data.message ?? "Please check your details.");
    setMessage(mode === "register" ? "Account created. Check your email to verify it." : "Signed in successfully.");
  }
  return <form onSubmit={submit}>{mode === "register" && <label>Full name<input name="displayName" autoComplete="name" required minLength={2}/></label>}<label>Email<input name="email" type="email" autoComplete="email" required/></label><label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={12}/></label><button className="button primary" type="submit">{mode === "login" ? "Sign in" : "Create account"}</button>{message && <p className="fine" role="status">{message}</p>}</form>;
}
