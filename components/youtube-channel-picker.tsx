"use client";
import { useState } from "react";

type ChannelVideo = { id: string; title: string; description: string; thumbnail: string; publishedAt: string };

export function YouTubeChannelPicker({ onSelect }: { onSelect: (video: ChannelVideo) => void }) {
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function load() {
    setLoading(true); setMessage("Loading your latest channel videos…");
    try {
      const response = await fetch("/api/admin/youtube-channel", { cache: "no-store" });
      const data = await response.json() as { videos?: ChannelVideo[]; error?: string };
      if (!response.ok) throw new Error(data.error || "Could not load your channel.");
      setVideos(data.videos || []); setMessage(data.videos?.length ? "Choose a video below." : "No public or unlisted uploads were found.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load your channel."); }
    finally { setLoading(false); }
  }
  return <div className="youtube-channel-picker">
    <div className="youtube-channel-actions"><button className="button secondary" type="button" disabled={loading} onClick={load}>{loading ? "Loading…" : "Choose from my YouTube channel"}</button><a href="/administration/media-apis">Connect or manage YouTube</a></div>
    <p role="status">{message}</p>
    {videos.length > 0 && <div className="youtube-channel-grid">{videos.map(video => <button type="button" key={video.id} onClick={() => { onSelect(video); setMessage(`Selected: ${video.title}`); }}><span className="youtube-channel-thumb">{video.thumbnail ? <img src={video.thumbnail} alt="" /> : <span>No thumbnail</span>}</span><span><strong>{video.title}</strong><small>{video.publishedAt ? new Date(video.publishedAt).toLocaleDateString() : "YouTube video"}</small></span></button>)}</div>}
  </div>;
}