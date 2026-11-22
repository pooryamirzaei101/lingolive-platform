export async function isAdmin() {
  if (process.env.LOCAL_ADMIN_MODE === "true") {
    const { headers } = await import("next/headers");
    const hostname = (await headers()).get("host")?.split(":")[0]?.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") return true;
  }

  const { getChatGPTUser } = await import("@/app/chatgpt-auth");
  const user = await getChatGPTUser();
  const address = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(user && address && user.email.trim().toLowerCase() === address);
}
