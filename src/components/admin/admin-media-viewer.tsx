"use client";

import { useEffect, useMemo, useState } from "react";

type MediaViewerItem = {
  url: string;
  title?: string | null;
  subtitle?: string | null;
  format?: string | null;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
  alt?: string | null;
};

type MediaType = "image" | "video" | "audio" | "unknown";

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif", "svg"]);
const VIDEO_EXT = new Set(["mp4", "webm", "ogg", "mov", "m4v"]);
const AUDIO_EXT = new Set(["mp3", "wav", "aac", "flac", "m4a", "ogg"]);

const inferType = (url: string, format?: string | null): MediaType => {
  const raw = (format ?? url.split("?")[0].split("#")[0].split(".").pop() ?? "").toLowerCase();
  if (IMAGE_EXT.has(raw)) return "image";
  if (VIDEO_EXT.has(raw)) return "video";
  if (AUDIO_EXT.has(raw)) return "audio";
  return "unknown";
};

const formatBytes = (bytes?: number | null) => {
  if (!bytes) return null;
  const kb = Math.round(bytes / 1024);
  if (kb < 1024) return `${kb} KB`;
  const mb = (kb / 1024).toFixed(1);
  return `${mb} MB`;
};

export default function AdminMediaViewer({
  open,
  item,
  onClose,
}: {
  open: boolean;
  item: MediaViewerItem | null;
  onClose: () => void;
}) {
  const mediaType = useMemo(() => (item ? inferType(item.url, item.format) : "unknown"), [item]);
  const [measuredSize, setMeasuredSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !item) return null;

  const displayWidth = item.width ?? measuredSize?.width ?? null;
  const displayHeight = item.height ?? measuredSize?.height ?? null;
  const displayBytes = formatBytes(item.bytes);

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
        <div
          className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-[0_30px_60px_rgba(31,27,24,0.25)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-[var(--pp-border)] px-6 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">Preview</p>
              <h3 className="text-lg font-[var(--font-heading)] text-[var(--pp-ink)]">
                {item.title ?? "Media preview"}
              </h3>
              {item.subtitle && <p className="text-xs text-[var(--pp-muted)]">{item.subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn-ghost h-9 w-9 items-center justify-center"
              aria-label="Close preview"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M6 6l12 12" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="bg-[var(--pp-beige)]/35 px-0 py-0">
            <div className="flex max-h-[60vh] items-center justify-center overflow-hidden">
              {mediaType === "video" ? (
                <video
                  src={item.url}
                  controls
                  className="max-h-[58vh] w-full bg-black"
                />
              ) : mediaType === "audio" ? (
                <div className="w-full px-6 py-8">
                  <audio src={item.url} controls className="w-full" />
                </div>
              ) : mediaType === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.url}
                  alt={item.alt ?? "Preview"}
                  className="max-h-[58vh] w-full object-contain"
                  onLoad={(event) => {
                    const target = event.currentTarget;
                    if (!target.naturalWidth || !target.naturalHeight) return;
                    setMeasuredSize({ width: target.naturalWidth, height: target.naturalHeight });
                  }}
                />
              ) : (
                <div className="px-6 py-12 text-center text-sm text-[var(--pp-muted)]">
                  Unsupported media type.
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pp-border)] px-6 py-4 text-xs text-[var(--pp-muted)]">
            <div className="flex flex-wrap items-center gap-2">
              {displayWidth && displayHeight && (
                <span className="rounded-full border border-[var(--pp-border)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--pp-ink)]/80">
                  {displayWidth}×{displayHeight}
                </span>
              )}
              {displayBytes && (
                <span className="rounded-full border border-[var(--pp-border)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--pp-ink)]/80">
                  {displayBytes}
                </span>
              )}
              {(item.format ?? "").length > 0 && (
                <span className="rounded-full border border-[var(--pp-border)] bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--pp-ink)]/80">
                  {item.format?.toUpperCase()}
                </span>
              )}
            </div>
            <button type="button" className="btn-outline admin-btn admin-btn-size" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
