import { isAdmin } from "@/lib/admin";
import { youtubeToken } from "@/lib/youtube-captions";

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: "Not authorized" }, { status: 403 });
  try {
    const token = await youtubeToken();
    const headers = { Authorization: `Bearer ${token}` };
    const channelId = String(process.env.YOUTUBE_CHANNEL_ID || "").trim();
    const channelQuery = channelId ? `id=${encodeURIComponent(channelId)}` : "mine=true";
    const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails,snippet&${channelQuery}`, { headers, signal: AbortSignal.timeout(15000) });
    const channelData = await channelResponse.json() as any;
    const playlistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!channelResponse.ok || !playlistId) throw new Error("Could not find the connected YouTube channel uploads.");
    const videosResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${encodeURIComponent(playlistId)}`, { headers, signal: AbortSignal.timeout(15000) });
    const videosData = await videosResponse.json() as any;
    if (!videosResponse.ok) throw new Error(videosData.error?.message || "Could not load channel videos.");
    const videos = (videosData.items || []).map((item: any) => ({
      id: String(item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || ""),
      title: String(item.snippet?.title || "Untitled video"),
      description: String(item.snippet?.description || "").slice(0, 4000),
      thumbnail: String(item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || ""),
      publishedAt: String(item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || ""),
    })).filter((item: any) => item.id && item.title !== "Private video" && item.title !== "Deleted video");
    return Response.json({ channel: { id: String(channelData.items?.[0]?.id || channelId), title: String(channelData.items?.[0]?.snippet?.title || "LingoLive"), url: String(process.env.YOUTUBE_CHANNEL_URL || "") }, videos }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Could not load the YouTube channel." }, { status: 400 });
  }
}