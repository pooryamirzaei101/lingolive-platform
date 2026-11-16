import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "LingoLive", description: "English that moves with you." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><div className="shell"><header><a className="brand" href="/">Lingo<span>Live</span></a><nav><a href="/login">Sign in</a><a href="/register">Join</a></nav></header>{children}</div></body></html>;
}
