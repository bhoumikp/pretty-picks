"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CloudUpload, X } from "lucide-react";
import JSZip from "jszip";
import Cropper from "react-easy-crop";

type CropArea = { x: number; y: number; width: number; height: number };

type UploadResult = {
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
};

type UploadItem = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "queued" | "uploading" | "done" | "error";
  error?: string;
  result?: UploadResult;
};

interface CloudinaryUploadWidgetProps {
  disabled?: boolean;
  maxFiles?: number;
  maxSizeMb?: number;
  registerInLibrary?: boolean;
  onUpload: (uploads: UploadResult[]) => void;
  onError?: (message: string) => void;
  onUploadedSummary?: (count: number) => void;
}

const bytesToMb = (bytes: number) => Math.round((bytes / 1024 / 1024) * 10) / 10;

export default function CloudinaryUploadWidget({
  disabled,
  maxFiles = 6,
  maxSizeMb = 4,
  registerInLibrary = true,
  onUpload,
  onError,
  onUploadedSummary,
}: CloudinaryUploadWidgetProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [cropEnabled, setCropEnabled] = useState(true);
  const [webpEnabled, setWebpEnabled] = useState(true);
  const [cropTarget, setCropTarget] = useState<UploadItem | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

  const canUpload = Boolean(cloudName && apiKey);

  const cleanupPreviews = useCallback((items: UploadItem[]) => {
    items.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  const addFiles = useCallback(
    async (list: FileList | File[]) => {
      const incoming = Array.from(list);
      if (!incoming.length) return;

      if (!canUpload) {
        onError?.("Cloudinary settings are missing.");
        return;
      }

      const maxZipBytes = maxSizeMb * maxFiles * 1024 * 1024;
      const nextItems: UploadItem[] = [];
      const currentCount = files.length;
      const processImageFile = (file: File, index: number) => {
        if (currentCount + nextItems.length >= maxFiles) return;
        if (!file.type.startsWith("image/")) return;
        if (file.size > maxSizeMb * 1024 * 1024) return;
        nextItems.push({
          id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          progress: 0,
          status: "queued",
        });
      };

      for (const [index, file] of incoming.entries()) {
        const isZip = file.type === "application/zip" || file.name.toLowerCase().endsWith(".zip");
        if (!isZip) {
          processImageFile(file, index);
          continue;
        }

        if (file.size > maxZipBytes) {
          onError?.(`ZIP is too large. Keep it under ${Math.round(maxZipBytes / 1024 / 1024)}MB.`);
          continue;
        }

        try {
          const zip = await JSZip.loadAsync(file);
          const entries = Object.values(zip.files);
          let addedFromZip = 0;
          let skippedFromZip = 0;
          for (const entry of entries) {
            if (entry.dir) continue;
            const name = entry.name.toLowerCase();
            if (!name.match(/\.(jpe?g|png|webp)$/)) {
              skippedFromZip += 1;
              continue;
            }
            if (currentCount + nextItems.length >= maxFiles) {
              skippedFromZip += 1;
              continue;
            }
            const blob = await entry.async("blob");
            if (blob.size > maxSizeMb * 1024 * 1024) {
              skippedFromZip += 1;
              continue;
            }
            const ext = name.split(".").pop() ?? "jpg";
            const extractedFile = new File([blob], entry.name, { type: `image/${ext === "jpg" ? "jpeg" : ext}` });
            processImageFile(extractedFile, index + addedFromZip + 1);
            addedFromZip += 1;
          }
          if (!addedFromZip) {
            onError?.("ZIP contains no supported images.");
          } else if (skippedFromZip > 0) {
            onError?.(`ZIP loaded ${addedFromZip} image${addedFromZip === 1 ? "" : "s"}, skipped ${skippedFromZip}.`);
          }
        } catch {
          onError?.("Unable to read ZIP file.");
        }
      }

      if (!nextItems.length) {
        onError?.(`Only images up to ${maxSizeMb}MB are allowed.`);
        return;
      }

      setFiles((prev) => [...prev, ...nextItems]);
    },
    [canUpload, files.length, maxFiles, maxSizeMb, onError]
  );

  const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    await addFiles(event.target.files);
    event.target.value = "";
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (disabled || uploading) return;
    if (event.dataTransfer?.files?.length) {
      await addFiles(event.dataTransfer.files);
    }
  };

  const handleRemove = (id: string) => {
    setFiles((prev) => {
      const next = prev.filter((item) => item.id !== id);
      const removed = prev.find((item) => item.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const handleClear = () => {
    setFiles((prev) => {
      cleanupPreviews(prev);
      return [];
    });
  };

  const handleCropConfirm = async () => {
    if (!cropTarget || !cropArea) {
      setCropTarget(null);
      return;
    }
    try {
      const cropped = await getCroppedBlob(cropTarget.previewUrl, cropArea);
      const nextFile = new File([cropped], cropTarget.file.name, { type: cropTarget.file.type });
      const nextPreview = URL.createObjectURL(nextFile);
      setFiles((prev) =>
        prev.map((item) => {
          if (item.id !== cropTarget.id) return item;
          URL.revokeObjectURL(item.previewUrl);
          return { ...item, file: nextFile, previewUrl: nextPreview };
        })
      );
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "Unable to crop image.");
    } finally {
      setCropTarget(null);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCropArea(null);
    }
  };

  const signUpload = async () => {
    const response = await fetch("/api/admin/media/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crop: cropEnabled, webp: webpEnabled }),
    });
    if (!response.ok) {
      throw new Error("Unable to prepare upload.");
    }
    return (await response.json()) as {
      signature: string;
      timestamp: number;
      apiKey: string;
      cloudName: string;
      folder: string;
      transformation?: string;
    };
  };

  const uploadFile = async (item: UploadItem, signature: Awaited<ReturnType<typeof signUpload>>) => {
    const form = new FormData();
    form.append("file", item.file);
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("signature", signature.signature);
    form.append("folder", signature.folder);
    if (signature.transformation) {
      form.append("transformation", signature.transformation);
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`;

    const response = await new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", endpoint);
      xhr.onload = () => {
        resolve(new Response(xhr.responseText, { status: xhr.status }));
      };
      xhr.onerror = () => reject(new Error("Upload failed."));
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return;
        const progress = Math.round((event.loaded / event.total) * 100);
        setFiles((prev) =>
          prev.map((entry) => (entry.id === item.id ? { ...entry, progress } : entry))
        );
      };
      xhr.send(form);
    });

    if (!response.ok) {
      throw new Error("Upload failed.");
    }
    const data = (await response.json()) as {
      secure_url: string;
      public_id?: string;
      format?: string;
      width?: number;
      height?: number;
      bytes?: number;
    };
    return {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
    };
  };

  const handleUpload = async () => {
    if (!files.length || uploading) return;
    setUploading(true);
    let signature;
    try {
      signature = await signUpload();
    } catch (error) {
      setUploading(false);
      onError?.(error instanceof Error ? error.message : "Unable to start upload.");
      return;
    }

    const uploads: UploadResult[] = [];
    await Promise.all(
      files.map(async (item) => {
        if (item.status === "done") return;
        setFiles((prev) =>
          prev.map((entry) =>
            entry.id === item.id ? { ...entry, status: "uploading", progress: entry.progress || 0 } : entry
          )
        );
        try {
          const result = await uploadFile(item, signature);
          uploads.push(result);
          setFiles((prev) =>
            prev.map((entry) =>
              entry.id === item.id ? { ...entry, status: "done", progress: 100, result } : entry
            )
          );
        } catch (error) {
          setFiles((prev) =>
            prev.map((entry) =>
              entry.id === item.id
                ? {
                    ...entry,
                    status: "error",
                    error: error instanceof Error ? error.message : "Upload failed.",
                  }
                : entry
            )
          );
        }
      })
    );

    setUploading(false);

    if (uploads.length) {
      onUpload(uploads);
      onUploadedSummary?.(uploads.length);
      if (registerInLibrary) {
        fetch("/api/admin/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: uploads }),
        }).catch(() => undefined);
      }
      handleClear();
    }
  };

  const dropHint = useMemo(
    () => `Max ${maxFiles} files · ${maxSizeMb}MB each`,
    [maxFiles, maxSizeMb]
  );

  return (
    <>
      <button
        type="button"
        className="btn-outline admin-btn admin-btn-size"
        onClick={() => setOpen(true)}
        disabled={disabled || !canUpload}
      >
        Upload images
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/45" onClick={() => setOpen(false)}>
          <div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
            <div
              className="w-full max-w-3xl border border-[var(--pp-border)] bg-white rounded-lg shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[var(--pp-border)] px-6 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">Upload</p>
                  <h3 className="text-lg font-[var(--font-heading)]">Add media</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
                  aria-label="Close upload"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-5 px-6 py-5">
                <div
                  className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--pp-border)] bg-[var(--pp-beige)]/30 px-6 py-8 text-center"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={handleDrop}
                >
                  <CloudUpload className="h-6 w-6 text-[var(--pp-muted)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--pp-ink)]">Drag & drop files</p>
                    <p className="text-xs text-[var(--pp-muted)]">{dropHint}</p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary admin-btn admin-btn-size"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled || uploading}
                  >
                    <span className="admin-btn-label">Choose files</span>
                  </button>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,.zip"
                    multiple
                    className="hidden"
                    onChange={handleInputChange}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--pp-muted)]">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cropEnabled}
                      onChange={(event) => setCropEnabled(event.target.checked)}
                    />
                    Auto crop 4:5
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={webpEnabled}
                      onChange={(event) => setWebpEnabled(event.target.checked)}
                    />
                    Convert to WebP
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="grid gap-3">
                    {files.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap items-center gap-4 rounded-lg border border-[var(--pp-border)] bg-white px-4 py-3"
                      >
                        <div className="relative h-16 w-12 overflow-hidden rounded-md border border-[var(--pp-border)] bg-[var(--pp-beige)]/30">
                          <Image
                            src={item.previewUrl}
                            alt={item.file.name}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-[180px] flex-1">
                          <p className="text-sm font-medium text-[var(--pp-ink)]">{item.file.name}</p>
                          <p className="text-xs text-[var(--pp-muted)]">
                            {bytesToMb(item.file.size)} MB · {item.file.type.replace("image/", "")}
                          </p>
                          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--pp-beige)]">
                            <div
                              className="h-full rounded-full bg-[var(--pp-gold)] transition-all"
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--pp-muted)]">
                          {item.status === "error" && (
                            <span className="text-red-600">{item.error ?? "Failed"}</span>
                          )}
                          {item.status === "done" && <span className="text-green-700">Uploaded</span>}
                          {item.status === "uploading" && <span>Uploading…</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="btn-outline admin-btn admin-btn-size h-8 px-2 text-[10px]"
                            onClick={() => {
                              setCropTarget(item);
                              setCrop({ x: 0, y: 0 });
                              setZoom(1);
                              setCropArea(null);
                            }}
                            disabled={item.status === "uploading"}
                          >
                            Crop
                          </button>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
                            onClick={() => handleRemove(item.id)}
                            disabled={item.status === "uploading"}
                            aria-label="Remove file"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pp-border)] bg-[var(--pp-beige)]/40 px-6 py-4">
                <button
                  type="button"
                  className="btn-outline admin-btn admin-btn-size"
                  onClick={handleClear}
                  disabled={!files.length || uploading}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn-primary admin-btn admin-btn-size"
                  onClick={handleUpload}
                  disabled={!files.length || uploading}
                >
                  <span className="admin-btn-label">{uploading ? "Uploading…" : "Upload"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {cropTarget && (
        <div className="fixed inset-0 z-50 bg-black/50">
          <div className="flex h-full w-full items-center justify-center px-4">
            <div className="w-full max-w-2xl border border-[var(--pp-border)] bg-white rounded-lg shadow-lg">
              <div className="flex items-center justify-between border-b border-[var(--pp-border)] px-6 py-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">Crop</p>
                  <h3 className="mt-2 text-lg font-[var(--font-heading)]">Adjust image</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCropTarget(null)}
                  className="flex h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
                  aria-label="Close crop"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="relative h-[60vh] bg-[var(--pp-beige)]/30">
                <Cropper
                  image={cropTarget.previewUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={4 / 5}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, areaPixels) => setCropArea(areaPixels)}
                />
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-[var(--pp-border)] bg-[var(--pp-beige)]/30 px-6 py-4">
                <div className="flex items-center gap-3 text-xs text-[var(--pp-muted)]">
                  Zoom
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(event) => setZoom(Number(event.target.value))}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" className="btn-outline admin-btn admin-btn-size" onClick={() => setCropTarget(null)}>
                    Cancel
                  </button>
                  <button type="button" className="btn-primary admin-btn admin-btn-size" onClick={handleCropConfirm}>
                    <span className="admin-btn-label">Apply crop</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

async function getCroppedBlob(imageSrc: string, cropArea: CropArea) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported.");

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  const pixelRatio = window.devicePixelRatio || 1;

  canvas.width = cropArea.width * pixelRatio;
  canvas.height = cropArea.height * pixelRatio;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    cropArea.x * scaleX,
    cropArea.y * scaleY,
    cropArea.width * scaleX,
    cropArea.height * scaleY,
    0,
    0,
    cropArea.width,
    cropArea.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Unable to crop image."));
        return;
      }
      resolve(blob);
    }, "image/jpeg");
  });
}

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () => reject(new Error("Unable to load image.")));
    image.src = url;
  });
}
