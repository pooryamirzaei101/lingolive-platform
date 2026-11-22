"use client";
import {MediaSectionPicker} from '@/components/media-section-picker';
import {ManualSubtitleInput} from '@/components/manual-subtitle-input';
import {YouTubeChannelPicker} from '@/components/youtube-channel-picker';
import {savedMediaSections} from '@/lib/media-sections';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DEFAULT_CATEGORIES,
  parseTranscript,
  type ContentSection,
  type VideoCategory,
} from "@/lib/video";
import {
  discardAdminMedia,
  prepareAdminMedia,
  uploadAdminMedia,
} from "@/lib/admin-upload-client";

import { generateThumbnailForLesson } from "@/lib/generate-thumbnail-client";
import { ThumbnailEditor } from "@/components/thumbnail-editor";
import { TranscriptEditor } from "@/components/transcript-editor";
import {
  translationLanguages,
  type TranslationLanguage,
} from "@/lib/languages";
const categoryLabel = (category: VideoCategory, categories: VideoCategory[]) =>
  `${category.parentId ? `${categories.find((c) => c.id === category.parentId)?.name || "Folder"} / ` : ""}${category.name}`;
export function VideoUpload({
  categories,
  initialSection = "video",
  lockedSection = false,
  studioLabel,
}: {
  categories: VideoCategory[];
  initialSection?: "video" | "speaking" | "youtube" | "podcast";
  lockedSection?: boolean;
  studioLabel?: "video" | "podcast" | "news" | "youtube";
}) {
  const router = useRouter(),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [section, setSection] = useState<"video" | "speaking" | "youtube" | "podcast">(
      initialSection,
    ),
    [formVersion,setFormVersion]=useState(0),
    [format, setFormat] = useState("landscape"),
    [mode, setMode] = useState(initialSection === "youtube" ? "srt" : "manual"),
    [lang, setLang] = useState<TranslationLanguage>("fa"),
    [title, setTitle] = useState(""),
    [description, setDescription] = useState(""),
    [sourceUrl, setSourceUrl] = useState(""),
    [videoSource, setVideoSource] = useState<"host" | "youtube">(initialSection === "youtube" ? "youtube" : "host"),
    [generateTranslation, setGenerateTranslation] = useState(false);
  const studioSourceChoice = lockedSection && (initialSection === "video" || initialSection === "podcast" || initialSection === "youtube");
  const workflowLabel = studioLabel || (section === "podcast" ? "podcast" : section === "youtube" ? "youtube" : "video");
  const youtubeSource = studioSourceChoice ? videoSource === "youtube" : section === "youtube";
  useEffect(() => {
    fetch("/api/admin/media-integrations")
      .then((r) => r.json() as Promise<any>)
      .then((c) => {
        if (section === "youtube" && c.youtubeConnected) setMode("captions");
        else if (section !== "youtube" && c.enabled && (c.transcriptionConnected??c.assemblyConnected))
          setMode("api");
      })
      .catch(() => {});
  }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget,
      transcriptionSource = form.querySelector<HTMLInputElement>(
        'input[name="transcriptionFile"]',
      )?.files?.[0],
      hasTranscriptionSource = !!transcriptionSource?.size,
      rightsConfirmed = new FormData(form).get("rightsConfirmed") === "on";
    setBusy(true);
    setMessage("Preparing uploadÃ¢â‚¬Â¦");
    let key: string | null = null;
    let saved = false;
    try {
      if (
        mode === "captions" &&
        !confirm(
          "Import English captions using your connected YouTube account and API quota?",
        )
      ) {
        setBusy(false);
        return;
      }
      if (mode === "assembly" && hasTranscriptionSource && !rightsConfirmed)
        throw Error(
          "Confirm that you own the uploaded file or have permission to transcribe it.",
        );
      if (
        (mode === "api" || (mode === "assembly" && hasTranscriptionSource)) &&
        !confirm(
          "Send your original media to the selected transcription provider for English transcription? Provider charges may apply.",
        )
      ) {
        setBusy(false);
        return;
      }
      const prepared =
        youtubeSource || section === "podcast"
          ? { body: new FormData(form), key: null as string|null }
          : await prepareAdminMedia(form, "video", setMessage);
      if(section==='podcast'&&!youtubeSource){
        const file=new FormData(form).get('video');
        if(!(file instanceof File)||!file.size)throw Error('Choose a podcast audio or video file.');
        prepared.key=await uploadAdminMedia(file,file.type.startsWith('audio/')?'audio':'video',setMessage);
        prepared.body.set('uploadKey',prepared.key);prepared.body.set('mediaKind',file.type.startsWith('audio/')?'audio':'video');prepared.body.delete('video');
      }
      key = prepared.key;
      prepared.body.delete("thumbnail");
      prepared.body.delete("transcriptionFile");
      prepared.body.delete("rightsConfirmed");
      prepared.body.set("sourceType", youtubeSource ? "youtube" : "host");
      if (mode === "assembly") prepared.body.set("transcriptMode", "api");
      const response = await fetch("/api/admin/video-lessons", {
          method: "POST",
          body: prepared.body,
        }),
        data = (await response.json()) as { error?: string; id?: string };
      if (!response.ok) throw new Error(data.error || "Upload failed");
      saved = true;
      const cover = form.querySelector<HTMLInputElement>(
        'input[name="thumbnail"]',
      )?.files?.[0];
      form.reset();
      setTitle(""); setDescription(""); setSourceUrl(""); setGenerateTranslation(false);
      setFormVersion(v=>v+1);
      router.refresh();
      if (data.id && cover) {
        const body = new FormData();
        body.set("image", cover);
        setMessage("Draft saved. Uploading thumbnailÃ¢â‚¬Â¦");
        const coverResponse = await fetch(
          `/api/admin/video-lessons/${data.id}/thumbnail`,
          { method: "POST", body },
        );
        if (!coverResponse.ok) {
          const coverError = (await coverResponse.json()) as { error?: string };
          throw Error(
            `Draft saved. ${coverError.error || "Thumbnail upload failed."}`,
          );
        }
        router.refresh();
      } else if (!youtubeSource && section !== "podcast" && data.id) {
        setMessage("Draft saved. Generating a cover from the videoÃ¢â‚¬Â¦");
        await generateThumbnailForLesson(data.id).catch(() => {});
        router.refresh();
      }
      if (
        youtubeSource &&
        mode === "assembly" &&
        data.id &&
        transcriptionSource
      ) {
        const source = transcriptionSource;
        const kind = source.type.startsWith("video/") ? "video" : "audio";
        setMessage(
          "Draft saved. Uploading your original transcription sourceÃ¢â‚¬Â¦",
        );
        let sourceKey: string | null = null;
        try {
          sourceKey = await uploadAdminMedia(source, kind, setMessage);
          const linked = await fetch(
            `/api/admin/video-lessons/${data.id}/transcription-source`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                uploadKey: sourceKey,
                kind,
                rightsConfirmed,
              }),
            },
          );
          const linkedData = (await linked.json()) as { error?: string };
          if (!linked.ok)
            throw Error(
              linkedData.error || "Could not save transcription source.",
            );
          sourceKey = null;
        } catch (error) {
          if (sourceKey) await discardAdminMedia(sourceKey);
          throw error;
        }
      }
      if (
        (mode === "api" && !youtubeSource) ||
        mode === "captions" ||
        (mode === "assembly" && hasTranscriptionSource)
      ) {
        setMessage(
          mode === "captions"
            ? "YouTube draft saved. Importing English captionsÃ¢â‚¬Â¦"
            : "Video draft saved. Starting English transcriptionÃ¢â‚¬Â¦",
        );
        const processing = await fetch(
          `/api/admin/video-lessons/${data.id}/processing`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: mode === "captions" ? "captions" : "start",
              languages: generateTranslation ? [lang] : [],
            }),
          },
        );
        const result = (await processing.json()) as any;
        if (!processing.ok) throw Error(`Video draft saved. ${result.error}`);
        setMessage(
          mode === "captions"
            ? "English captions imported. Open the draft below to review and save, then generate the translation."
            : "English transcription started. Open the draft below to review and save its timestamps, then generate the translation.",
        );
        router.refresh();
      } else if (mode === "assembly")
        setMessage(
          "YouTube draft saved without an original media file. Open the draft to upload one later for the selected transcription provider, or import SRT/VTT, captions, or text instead.",
        );
      else
        setMessage(
          "Draft saved. Open the lesson below to review and adjust sentence timings before publishing.",
        );
      if (generateTranslation && data.id && (mode === "manual" || mode === "srt")) {
        setMessage(`Draft saved. Generating ${translationLanguages[lang]} translationÃ¢â‚¬Â¦`);
        const translation = await fetch(`/api/admin/video-lessons/${data.id}/processing`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "translate", languages: [lang] }),
        });
        const translationResult = await translation.json() as { error?: string };
        if (!translation.ok) throw Error(`Draft saved. ${translationResult.error || "Translation could not start."}`);
        setMessage(`Draft saved. ${translationLanguages[lang]} translation generation started; review it before publishing.`);
        router.refresh();
      }
    } catch (error) {
      if (key && !saved) await discardAdminMedia(key);
      setMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="admin-form video-create-workflow">
      {studioSourceChoice && <fieldset className="studio-step source-choice"><legend><span>1</span> Choose {workflowLabel === "news" ? "news video" : workflowLabel === "youtube" ? "lesson video" : workflowLabel} source</legend><div className="source-choice-grid">
        <label className={videoSource === "host" ? "selected" : ""}><input type="radio" checked={videoSource === "host"} onChange={() => { setVideoSource("host"); setMode("manual"); }} /><span><strong>Upload on host</strong><small>{section === "podcast" ? "Upload audio, MP4, or WebM to LingoLive." : "Upload MP4 or WebM to LingoLive."}</small></span></label>
        <label className={videoSource === "youtube" ? "selected" : ""}><input type="radio" checked={videoSource === "youtube"} onChange={() => { setVideoSource("youtube"); setMode("srt"); }} /><span><strong>Add from YouTube</strong><small>Paste a YouTube video or Shorts link.</small></span></label>
      </div>{youtubeSource&&<div className="youtube-source-panel"><div><strong>YouTube video source</strong><p>Paste a public YouTube video or Shorts URL below. The link is saved with the draft.</p></div><YouTubeChannelPicker onSelect={(video) => { setSourceUrl(`https://www.youtube.com/watch?v=${video.id}`); if (!title.trim()) setTitle(video.title); if (!description.trim()) setDescription(video.description); }} /><label>YouTube video or Shorts URL<input name="sourceUrl" type="url" inputMode="url" autoComplete="url" placeholder="https://www.youtube.com/watch?v=..." value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} required autoFocus /></label></div>}<input type="hidden" name="contentKind" value={section} /></fieldset>}

      <section className="studio-step"><h3><span>{studioSourceChoice ? 2 : 1}</span> Folder and subfolder</h3><div className="admin-form-row">
        {!lockedSection && <label>Content section<select name="contentKind" value={section} onChange={(e) => setSection(e.target.value as "video" | "speaking" | "youtube" | "podcast")}><option value="video">Video lesson</option><option value="speaking">Speaking video</option><option value="youtube">YouTube video</option><option value="podcast">Podcast</option></select></label>}
        <label>Folder / subfolder<select name="category" key={section} required>{categories.filter((c) => c.section === section).map((c) => <option value={c.id} key={c.id}>{categoryLabel(c, categories)}</option>)}</select></label>
      </div><p className="field-help">Subfolders appear as Ã¢â‚¬Å“Main folder / SubfolderÃ¢â‚¬Â. Create missing folders above first.</p></section>

      <section className="studio-step"><h3><span>{studioSourceChoice ? 3 : 2}</span> Title and description</h3>
        <label>Title<input name="title" required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>Description<textarea name="description" rows={6} required maxLength={4000} placeholder="Describe what students will learn." value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        <MediaSectionPicker initial={[initialSection]} /><label>Level<select name="level"><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></label>
      </section>

      <section className="studio-step"><h3><span>{studioSourceChoice ? 4 : 3}</span> Thumbnail</h3><label>Thumbnail / cover image (optional: JPG, PNG, WebP, up to 8 MB)<input name="thumbnail" type="file" accept="image/jpeg,image/png,image/webp" /></label><p className="field-help">For a host video, LingoLive can generate a cover if none is uploaded.</p></section>

      <section className="studio-step"><h3><span>{studioSourceChoice ? 5 : 4}</span> {workflowLabel === "podcast" ? "Podcast format and media" : workflowLabel === "news" ? "News video format and media" : "Video format and media"}</h3>
        <label>Video format<select name="displayFormat" value={format} onChange={(e) => setFormat(e.target.value)}><option value="landscape">Standard landscape (16:9)</option><option value="vertical">Vertical / Short (9:16)</option><option value="square">Square (1:1)</option></select></label>
        {youtubeSource ? <div className="selected-source-summary"><strong>YouTube source selected</strong><span>{sourceUrl||"Add the YouTube URL in step 1 above."}</span></div> : <label>{section === "podcast" ? "Podcast audio or video (up to 100 MB)" : "Upload video on host (MP4 or WebM, up to 100 MB)"}<input name="video" type="file" accept={section === "podcast" ? "video/mp4,video/webm,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm" : "video/mp4,video/webm"} required /></label>}
      </section>

      <section className="studio-step"><h3><span>{studioSourceChoice ? 6 : 5}</span> Choose how to add English transcript</h3><fieldset className="transcript-methods"><legend>English transcript method</legend>
        <label className={mode === "srt" ? "selected" : ""}><input type="radio" name="transcriptMode" value="srt" checked={mode === "srt"} onChange={() => setMode("srt")} /><span><strong>Upload SRT file</strong><small>Import timed English subtitles.</small></span></label>
        {youtubeSource && <label className={mode === "captions" ? "selected" : ""}><input type="radio" name="transcriptMode" value="captions" checked={mode === "captions"} onChange={() => setMode("captions")} /><span><strong>Import YouTube captions</strong><small>Use captions from your connected channel.</small></span></label>}
        <label className={(mode === "api" || mode === "assembly") ? "selected" : ""}><input type="radio" name="transcriptMode" value={youtubeSource ? "assembly" : "api"} checked={mode === "api" || mode === "assembly"} onChange={() => setMode(youtubeSource ? "assembly" : "api")} /><span><strong>Generate with transcription API</strong><small>{youtubeSource ? "Provide matching original media." : "Generate from the host video."}</small></span></label>
        <label className={mode === "manual" ? "selected" : ""}><input type="radio" name="transcriptMode" value="manual" checked={mode === "manual"} onChange={() => setMode("manual")} /><span><strong>Paste transcript or add line by line</strong><small>Paste timestamped English and translation, or edit separate sentence boxes.</small></span></label>
      </fieldset></section>

      <section className="studio-step"><h3><span>{studioSourceChoice ? 7 : 6}</span> English transcript input</h3>
        {mode === "srt" ? <label>English SRT file (up to 10 MB)<input name="englishSrt" type="file" accept=".srt" required /></label> : mode === "assembly" && youtubeSource ? <div className="admin-form"><label>Matching original audio or video (optional, up to 100 MB)<input name="transcriptionFile" type="file" accept="video/mp4,video/webm,audio/mpeg,audio/mp4,audio/wav,audio/ogg,audio/webm" /></label><label className="inline-check"><input name="rightsConfirmed" type="checkbox" /> I own this file or have permission to transcribe it.</label><p className="field-help">The file must exactly match the YouTube video.</p></div> : mode === "manual" ? <ManualSubtitleInput key={formVersion} language={lang} /> : <p className="api-note"><a href="/administration/media-apis">{mode === "captions" ? "Connect your YouTube account" : "Configure transcription API"}</a>. Generated sentences remain editable in the draft.</p>}
      </section>

      <section className="studio-step"><h3><span>{studioSourceChoice ? 8 : 7}</span> Translation</h3>
        <div className="translation-choice"><label><input type="checkbox" checked={generateTranslation} onChange={(e) => setGenerateTranslation(e.target.checked)} /><span><strong>Generate translation with API after English</strong><small>Uses the generated transcript or uploaded English SRT as its base.</small></span></label></div>
        <label>Translation language<select name="translationLanguage" value={lang} onChange={(e) => setLang(e.target.value as TranslationLanguage)}>{Object.entries(translationLanguages).map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label>
        {mode === "srt" && <label>Or upload translated SRT (optional, matching timestamps)<input name="translationSrt" type="file" accept=".srt" /></label>}
      </section>

      <section className="studio-step draft-step"><h3><span>{studioSourceChoice ? 9 : 8}</span> Create draft and edit sentence boxes</h3><p>Nothing is published yet. Create the draft, then open it below to edit every English and translated sentence, adjust timestamps, preview, and publish.</p><button className="button primary" disabled={busy}>{busy ? "SavingÃ¢â‚¬Â¦" : "Create draft"}</button><p role="status" className="form-status">{message}</p></section>
    </form>
  );}

export function VideoEditor({
  id,
  initial,
  status,
  category,
  categories,
  contentKind,
  title,
  description,
  level,
  displayFormat,
  sourceUrl,
  thumbnailKey,
  thumbnailSource,
  thumbnailSettings,
  sections = "[]",
  mimeType = "video/mp4",
  hasTranscriptionSource = false,
}: {
  id: string;
  initial: string;
  status: string;
  category: string;
  categories: VideoCategory[];
  contentKind: string;
  title: string;
  description: string;
  level: string;
  displayFormat: string;
  sourceUrl: string | null;
  thumbnailKey: string | null;
  thumbnailSource: string;
  thumbnailSettings: string;
  sections?: string;
  mimeType?: string;
  hasTranscriptionSource?: boolean;
}) {
  const router = useRouter(),
    [mediaVersion, setMediaVersion] = useState(0),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const hasSavedEnglish = parseTranscript(initial).length > 0;
  const isYoutube = contentKind === "youtube" || !!sourceUrl;
  async function change(body: object, method = "PATCH") {
    setBusy(true);
    setMessage("SavingÃ¢â‚¬Â¦");
    try {
      const response = await fetch(`/api/admin/video-lessons/${id}`, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save");
      setMessage(method === "DELETE" ? "Deleted." : "Saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  async function replaceVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("Preparing replacementÃ¢â‚¬Â¦");
    let key: string | null = null;
    try {
      const prepared = await prepareAdminMedia(
        event.currentTarget,
        "video",
        setMessage,
      );
      key = prepared.key;
      prepared.body.delete("thumbnail");
      const response = await fetch(`/api/admin/video-lessons/${id}/media`, {
          method: "POST",
          body: prepared.body,
        }),
        data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not upload");
      setMediaVersion(Date.now());
      setMessage(
        "Video replaced. Review the transcript before publishing again.",
      );
      router.refresh();
    } catch (error) {
      if (key) await discardAdminMedia(key);
      setMessage(error instanceof Error ? error.message : "Could not upload");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="admin-editor">
      <div className="admin-actions">
        <button
          type="button"
          className="button secondary"
          disabled={
            busy ||
            (isYoutube &&
              status !== "published" &&
              !hasSavedEnglish)
          }
          onClick={() =>
            change({ status: status === "published" ? "draft" : "published" })
          }
        >
          {status === "published"
            ? "Unpublish"
            : isYoutube
              ? "Publish lesson and saved translations"
              : "Publish"}
        </button>
        <button
          type="button"
          className="button danger"
          disabled={busy}
          onClick={() => {
            if (
              confirm(
                `Permanently delete Ã¢â‚¬Å“${title}Ã¢â‚¬Â and its uploaded video, transcript, and cover image? This cannot be undone.`,
              )
            )
              change({}, "DELETE");
          }}
        >
          Delete video
        </button>
      </div>
      {isYoutube &&
        !hasSavedEnglish &&
        status !== "published" && (
          <p className="translation-pending">
            Create, review, and save the timestamped English transcript before
            publishing this YouTube lesson.
          </p>
        )}
      <p role="status">{message}</p>
      {status === "draft" && <div className="notice"><strong>Draft editing unlocked.</strong> You can edit the title, description, folder, placement sections, level, video format, source, thumbnail, English transcript, translations, timings, sentence boxes, and uploaded video before publishing again.</div>}
      <form
        className="admin-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          change({...Object.fromEntries(form.entries()),sections:form.getAll("sections")});
        }}
      >
        <MediaSectionPicker initial={savedMediaSections(sections)}/><label>
          Lesson title
          <input name="title" defaultValue={title} maxLength={160} required />
        </label>
        <label>
          Description
          <textarea
            name="description"
            defaultValue={description}
            rows={6}
            maxLength={4000}
          />
        </label>
        <div className="admin-form-row">
          <label>
            Level
            <select name="level" defaultValue={level}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
          {(
            <label>
              Video format
              <select name="displayFormat" defaultValue={displayFormat}>
                <option value="landscape">Standard (landscape)</option>
                <option value="vertical">Vertical (reel style)</option>
                <option value="square">Square (1:1)</option>
              </select>
            </label>
          )}
        </div>
        {isYoutube && (
          <label>
            YouTube URL
            <input
              name="sourceUrl"
              defaultValue={sourceUrl?.replace("/embed/", "/watch?v=")}
              required
            />
          </label>
        )}
        <button className="button secondary" disabled={busy}>
          Save details
        </button>
      </form>
      <label className="admin-category-select">
        Move to folder
        <select
          value={category}
          onChange={(event) => {
            const selected = categories.find(
              (item) => item.id === event.target.value,
            );
            if (selected)
              change({ category: selected.id, contentKind: selected.section });
          }}
          disabled={busy}
        >
          {!categories.some((item) => item.id === category) && (
            <option value={category}>{category} (old folder)</option>
          )}
          {categories
            .filter(
              (item) =>
                ["video", "speaking", "youtube"].includes(item.section) &&
                (isYoutube
                  ? item.section === "youtube"
                  : item.section !== "youtube"),
            )
            .map((item) => (
              <option value={item.id} key={item.id}>
                {sectionNames[item.section]} / {categoryLabel(item, categories)}
              </option>
            ))}
        </select>
      </label>
      <ThumbnailEditor
        id={id}
        format={displayFormat}
        thumbnailKey={thumbnailKey}
        thumbnailSource={thumbnailSource}
        settings={thumbnailSettings}
        videoAvailable={!isYoutube&&!mimeType.startsWith("audio/")}
      />
      {
        <TranscriptEditor
          id={id}
          initial={initial}
          status={status}
          podcast={contentKind === "podcast"}
          podcastAudio={contentKind === "podcast"&&mimeType.startsWith("audio/")}
          youtube={isYoutube}
          sourceUrl={sourceUrl || undefined}
          mediaVersion={mediaVersion}
          hasTranscriptionSource={hasTranscriptionSource}
        />
      }
      {!isYoutube && contentKind !== "podcast" && (
        <form className="admin-form" onSubmit={replaceVideo}>
          <label>
            Replace video (MP4 or WebM, up to 100 MB)
            <input
              name="video"
              type="file"
              accept="video/mp4,video/webm"
              required
            />
          </label>
          <button className="button secondary" disabled={busy}>
            Replace video
          </button>
        </form>
      )}
      <p role="status">{message}</p>
    </div>
  );
}

const sectionNames: Record<ContentSection, string> = {
  podcast: "Podcasts",
  video: "Video Lessons",
  speaking: "Speaking Practice",
  reading: "Reading Room",
  daily: "Daily Lessons",
  youtube: "YouTube Videos",
  ielts: "IELTS Examples",
  tips: "Quick Tips",
};
const categoryHref = (section: ContentSection, id: string) =>
  section === "podcast"
    ? `/podcasts`
    : section === "reading"
      ? `/reading-room/categories/${id}`
      : section === "speaking"
        ? `/speaking-practice/categories/${id}`
        : section === "video"
          ? id === "news"
            ? "/news"
            : `/video-lessons/categories/${id}`
          : `/${{ podcast: "podcasts", daily: "daily-lessons", youtube: "youtube-videos", ielts: "ielts-examples", tips: "quick-tips" }[section]}/categories/${id}`;
export function CategoryManager({
  categories,
  section,
  rootId,
}: {
  categories: VideoCategory[];
  section: ContentSection;
  rootId?: string;
}) {
  const router = useRouter(),
    [newName, setNewName] = useState(""),
    [parentId, setParentId] = useState(rootId || ""),
    [editing, setEditing] = useState<string | null>(null),
    [name, setName] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function save(
    method: "POST" | "PATCH" | "DELETE",
    body: { name?: string; id?: string; parentId?: string | null },
  ) {
    setBusy(true);
    setMessage("SavingÃ¢â‚¬Â¦");
    try {
      const response = await fetch("/api/admin/video-categories", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...body, section }),
        }),
        data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save");
      setNewName("");
      setEditing(null);
      setMessage(method === "DELETE" ? "Folder deleted." : "Folder saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save");
    } finally {
      setBusy(false);
    }
  }
  const all = categories.filter((c) => c.section === section);
  const belongsToRoot = (category: VideoCategory) => {
    let parent = category.parentId;
    for (let i = 0; i < all.length && parent; i++) {
      if (parent === rootId) return true;
      parent = all.find((item) => item.id === parent)?.parentId || null;
    }
    return false;
  };
  const underNews = (category: VideoCategory) => {
    let parent = category.parentId;
    for (let i = 0; i < all.length && parent; i++) {
      if (parent === "news") return true;
      parent = all.find((item) => item.id === parent)?.parentId || null;
    }
    return false;
  };
  const list = rootId
    ? all.filter(belongsToRoot)
    : section === "video"
      ? all.filter((c) => c.id !== "news" && !underNews(c))
      : all;
  return (
    <div className="category-manager">
      <div className="section-head">
        <div>
          <h2>{rootId ? "News" : sectionNames[section]} folders</h2>
          <p>
            Open a folder to see its lessons. Add a main folder or subcategory;
            renaming keeps its content in place.
          </p>
        </div>
      </div>
      <div className="category-admin-grid">
        {list.map((c) => (
          <div className="category-admin-row" key={c.id}>
            {editing === c.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  save("PATCH", { id: c.id, name });
                }}
              >
                <input
                  aria-label={`Rename ${c.name}`}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={60}
                  required
                />
                <button disabled={busy}>Save</button>
                <button type="button" onClick={() => setEditing(null)}>
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <strong>{categoryLabel(c, all)}</strong>
                <a
                  className="category-open-link"
                  href={`/administration/folders/${section}/${c.id}`}
                >
                  Open folder
                </a>
                <a
                  className="category-open-link"
                  href={
                    rootId
                      ? `/news/categories/${c.id}`
                      : categoryHref(section, c.id)
                  }
                >
                  Student view
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(c.id);
                    setName(c.name);
                  }}
                >
                  Rename
                </button>
                {!DEFAULT_CATEGORIES[section].some(
                  (item) => item.id === c.id,
                ) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      if (confirm(`Delete the empty folder "${c.name}"?`))
                        save("DELETE", { id: c.id });
                    }}
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      <form
        className="category-add"
        onSubmit={(e) => {
          e.preventDefault();
          save("POST", { name: newName, parentId: parentId || null });
        }}
      >
        <label>
          New folder
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            maxLength={60}
            placeholder={
              rootId
                ? "For example: World News"
                : section === "video"
                  ? "For example: Grammar Practice"
                  : section === "podcast"
                    ? `/podcasts`
                    : section === "reading"
                      ? "For example: Travel Stories"
                      : "For example: Job interviews"
            }
            required
          />
        </label>
        <label>
          Inside folder
          <select
            value={parentId}
            onChange={(e) => setParentId(e.target.value)}
          >
            {rootId ? (
              <option value={rootId}>News</option>
            ) : (
              <option value="">Main folder</option>
            )}
            {list.map((c) => (
              <option value={c.id} key={c.id}>
                {categoryLabel(c, all)}
              </option>
            ))}
          </select>
        </label>
        <button className="button secondary" disabled={busy}>
          Add folder
        </button>
      </form>
      <p role="status">{message}</p>
    </div>
  );
}
