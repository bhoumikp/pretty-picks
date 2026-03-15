"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, GripVertical, Trash2 } from "lucide-react";
import type { CategorySummary, ProductImage } from "@/types/catalog";
import ToastStack from "@/components/ui/toast-stack";
import { buildFieldErrors, validateMinLength, validateNumberMin, validateRequired } from "@/lib/validation";
import { RequiredMark } from "@/components/admin/admin-form-helpers";
import AdminSelect from "@/components/admin/admin-select";
import AdminMediaViewer from "@/components/admin/admin-media-viewer";

interface AdminProductFormProps {
  categories: CategorySummary[];
  initialProduct?: {
    id: string;
    name: string;
    price: number;
    description: string;
    material: string;
    images: ProductImage[];
    stock: number;
    categoryId: string;
  };
}

const emptyForm = {
  id: "",
  name: "",
  price: "",
  description: "",
  material: "",
  images: [] as ProductImage[],
  stock: "",
  categoryId: "",
};

export default function AdminProductForm({
  categories,
  initialProduct,
}: AdminProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(() => {
    if (!initialProduct) return emptyForm;
    return {
      id: initialProduct.id,
      name: initialProduct.name,
      price: String(initialProduct.price),
      description: initialProduct.description,
      material: initialProduct.material,
      images: initialProduct.images ?? [],
      stock: String(initialProduct.stock),
      categoryId: initialProduct.categoryId,
    };
  });
  const [loading, setLoading] = useState(false);
  const [uploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type?: "success" | "error" | "warning" | "primary" }>
  >([]);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [libraryItems, setLibraryItems] = useState<Array<{ id: string; url: string; publicId?: string | null }>>([]);
  const [libraryTotal, setLibraryTotal] = useState(0);
  const [libraryPage, setLibraryPage] = useState(1);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedLibrary, setSelectedLibrary] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<{
    url: string;
    publicId?: string | null;
    title?: string | null;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    price?: string;
    material?: string;
    stock?: string;
    categoryId?: string;
    description?: string;
    images?: string;
    imageUrl?: string;
  }>({});
  const clearFieldError = (field: keyof typeof fieldErrors) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };
  const updateImages = (nextImages: ProductImage[]) => {
    setForm((prev) => ({ ...prev, images: nextImages }));
    if (fieldErrors.images) clearFieldError("images");
  };

  const maxFiles = 12;
  const mediaPageSize = 20;

  const fetchLibrary = useCallback(
    async (nextQuery: string, nextPage: number) => {
      setLibraryLoading(true);
      const params = new URLSearchParams();
      if (nextQuery.trim()) params.set("q", nextQuery.trim());
      params.set("page", String(nextPage));
      params.set("pageSize", String(mediaPageSize));
      const response = await fetch(`/api/admin/media?${params.toString()}`, { cache: "no-store" });
      if (response.ok) {
        const data = (await response.json()) as { items: Array<{ id: string; url: string; publicId?: string | null }>; total: number };
        setLibraryItems(data.items);
        setLibraryTotal(data.total);
      } else {
        setLibraryItems([]);
        setLibraryTotal(0);
      }
      setLibraryLoading(false);
    },
    [mediaPageSize]
  );

  const totalLibraryPages = useMemo(() => Math.max(1, Math.ceil(libraryTotal / mediaPageSize)), [libraryTotal, mediaPageSize]);

  useEffect(() => {
    if (!libraryOpen) return;
    const handle = window.setTimeout(() => {
      fetchLibrary(libraryQuery, libraryPage);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [fetchLibrary, libraryOpen, libraryPage, libraryQuery]);

  useEffect(() => {
    if (!libraryOpen) return;
    const handle = window.setTimeout(() => {
      setLibraryPage(1);
      fetchLibrary(libraryQuery, 1);
    }, 250);
    return () => window.clearTimeout(handle);
  }, [libraryQuery, libraryOpen, fetchLibrary]);

  useEffect(() => {
    if (!libraryOpen && !previewItem) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (previewItem) setPreviewItem(null);
      if (libraryOpen) setLibraryOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [libraryOpen, previewItem]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setToasts([]);
    setError(null);
    setFieldErrors({});

    const imagesError =
      form.images.length === 0
        ? { field: "Images", message: "Please add at least one product image." }
        : form.images.length > maxFiles
        ? { field: "Images", message: `Max ${maxFiles} images allowed.` }
        : null;

    const nextErrors = buildFieldErrors<
      "name" | "price" | "material" | "stock" | "categoryId" | "description" | "images"
    >([
      { key: "name", error: validateRequired(form.name, "Product name") },
      { key: "price", error: validateNumberMin(Number(form.price), 1, "Price") },
      { key: "material", error: validateRequired(form.material, "Material") },
      { key: "stock", error: validateNumberMin(Number(form.stock || 0), 0, "Stock") },
      {
        key: "categoryId",
        error: validateRequired(form.categoryId, "Category"),
        message: "Please select a category.",
      },
      { key: "description", error: validateMinLength(form.description, 10, "Description") },
      {
        key: "images",
        error: imagesError,
      },
    ]);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name,
      price: Number(form.price),
      description: form.description,
      material: form.material,
      images: form.images,
      stock: Number(form.stock || 0),
      categoryId: form.categoryId,
    };

    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/products/${form.id}` : "/api/products";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      setError("Unable to save product. Please try again.");
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [
        ...prev,
        { id, type: "error", message: "Unable to save product. Please try again." },
      ]);
      setLoading(false);
      return;
    }

    setLoading(false);
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [
      ...prev,
      { id, type: "success", message: form.id ? "Product updated." : "Product created." },
    ]);
    if (form.id) {
      router.refresh();
    } else {
      router.push("/admin/products");
    }
  };

  const handleRemoveImage = async (index: number) => {
    updateImages(form.images.filter((_, idx) => idx !== index));
  };

  const handleAddFromLibrary = () => {
    if (!selectedLibrary.size) return;
    const remainingSlots = Math.max(0, maxFiles - form.images.length);
    if (remainingSlots <= 0) {
      setError(`You can add up to ${maxFiles} images.`);
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { id, type: "warning", message: `Max ${maxFiles} images allowed.` }]);
      return;
    }
    const selected = libraryItems.filter((item) => selectedLibrary.has(item.id));
    const nextImages: ProductImage[] = selected.map((item) => ({
      url: item.url,
      publicId: item.publicId ?? undefined,
    }));
    const merged = [...form.images];
    nextImages.forEach((img) => {
      if (!merged.find((existing) => existing.url === img.url)) {
        merged.push(img);
      }
    });
    if (merged.length > maxFiles) {
      setError(`Only ${maxFiles} images can be selected.`);
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { id, type: "warning", message: `Trimmed to ${maxFiles} images.` }]);
      updateImages(merged.slice(0, maxFiles));
    } else {
      updateImages(merged);
      setError(null);
    }
    setSelectedLibrary(new Set());
    setLibraryOpen(false);
  };

  const handleToggleLibrarySelection = (itemId: string) => {
    setSelectedLibrary((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
        if (error) setError(null);
        return next;
      }
      if (form.images.length + next.size >= maxFiles) {
        setError(`You can select up to ${maxFiles} images.`);
        const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setToasts((existing) => [
          ...existing,
          { id, type: "warning", message: `Max ${maxFiles} images allowed.` },
        ]);
        return next;
      }
      next.add(itemId);
      if (error) setError(null);
      return next;
    });
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="soft-card p-6 rounded-lg" noValidate>
        <h3 className="text-lg font-[var(--font-heading)] border-b border-[var(--pp-border)] pb-3">
          Basic details
        </h3>
        <div className="mt-4 grid gap-4">
          <div className="grid items-start gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <label htmlFor="admin-product-name" className="admin-label">
                Product name<RequiredMark />
              </label>
              <input
                id="admin-product-name"
                className={`admin-input ${fieldErrors.name ? "is-error" : ""}`}
                placeholder="Product name"
                value={form.name}
                onChange={(event) => {
                  setForm({ ...form, name: event.target.value });
                  if (fieldErrors.name) clearFieldError("name");
                }}
                onBlur={(event) => {
                  if (!fieldErrors.name) return;
                  const result = validateRequired(event.target.value, "Product name");
                  if (!result) {
                    setFieldErrors((prev) => ({ ...prev, name: undefined }));
                  }
                }}
              />
              <span
                data-show={Boolean(fieldErrors.name)}
                className="field-error text-xs normal-case text-red-600"
              >
                {fieldErrors.name ?? ""}
              </span>
            </div>

            <div className="grid gap-2">
              <label className="admin-label">
                Category<RequiredMark />
              </label>
              <AdminSelect
                value={form.categoryId}
                onChange={(nextValue) => {
                  const nextCategoryId = String(nextValue);
                  setForm({ ...form, categoryId: nextCategoryId });
                  if (fieldErrors.categoryId && nextCategoryId) {
                    clearFieldError("categoryId");
                  }
                }}
                options={[
                  { value: "", label: "Select category" },
                  ...categories.map((category) => ({ value: category.id, label: category.name })),
                ]}
                fullWidth
                buttonClassName={`w-full admin-input ${fieldErrors.categoryId ? "is-error" : ""}`}
                header="Category"
                ariaLabel="Category"
              />
              <span
                data-show={Boolean(fieldErrors.categoryId)}
                className="field-error text-xs normal-case text-red-600"
              >
                {fieldErrors.categoryId ?? ""}
              </span>
            </div>
          </div>

          <div className="grid items-start gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <label htmlFor="admin-product-material" className="admin-label">
                Material<RequiredMark />
              </label>
              <input
                id="admin-product-material"
                className={`admin-input ${fieldErrors.material ? "is-error" : ""}`}
                placeholder="Material"
                value={form.material}
                onChange={(event) => {
                  setForm({ ...form, material: event.target.value });
                  if (fieldErrors.material) clearFieldError("material");
                }}
                onBlur={(event) => {
                  if (!fieldErrors.material) return;
                  const result = validateRequired(event.target.value, "Material");
                  if (!result) {
                    setFieldErrors((prev) => ({ ...prev, material: undefined }));
                  }
                }}
              />
              <span
                data-show={Boolean(fieldErrors.material)}
                className="field-error text-xs normal-case text-red-600"
              >
                {fieldErrors.material ?? ""}
              </span>
            </div>

            <div className="grid gap-2">
              <label htmlFor="admin-product-price" className="admin-label">
                Price<RequiredMark />
              </label>
              <input
                id="admin-product-price"
                className={`admin-input ${fieldErrors.price ? "is-error" : ""}`}
                placeholder="Price"
                type="number"
                value={form.price}
                onChange={(event) => {
                  setForm({ ...form, price: event.target.value });
                  if (fieldErrors.price) clearFieldError("price");
                }}
                onBlur={(event) => {
                  if (!fieldErrors.price) return;
                  const value = Number(event.target.value);
                  const result = validateNumberMin(value, 1, "Price");
                  if (!result) {
                    setFieldErrors((prev) => ({ ...prev, price: undefined }));
                  }
                }}
              />
              <span
                data-show={Boolean(fieldErrors.price)}
                className="field-error text-xs normal-case text-red-600"
              >
                {fieldErrors.price ?? ""}
              </span>
            </div>

            <div className="grid gap-2">
              <label htmlFor="admin-product-stock" className="admin-label">
                Stock<RequiredMark />
              </label>
              <input
                id="admin-product-stock"
                className={`admin-input ${fieldErrors.stock ? "is-error" : ""}`}
                placeholder="Stock"
                type="number"
                value={form.stock}
                onChange={(event) => {
                  setForm({ ...form, stock: event.target.value });
                  if (fieldErrors.stock) clearFieldError("stock");
                }}
                onBlur={(event) => {
                  if (!fieldErrors.stock) return;
                  const value = Number(event.target.value || 0);
                  const result = validateNumberMin(value, 0, "Stock");
                  if (!result) {
                    setFieldErrors((prev) => ({ ...prev, stock: undefined }));
                  }
                }}
              />
              <span
                data-show={Boolean(fieldErrors.stock)}
                className="field-error text-xs normal-case text-red-600"
              >
                {fieldErrors.stock ?? ""}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-2">
          <label htmlFor="admin-product-description" className="admin-label">
            Description<RequiredMark />
          </label>
          <textarea
            id="admin-product-description"
            className={`admin-textarea ${fieldErrors.description ? "is-error" : ""}`}
            placeholder="Description"
            rows={3}
            value={form.description}
            onChange={(event) => {
              setForm({ ...form, description: event.target.value });
              if (fieldErrors.description) clearFieldError("description");
            }}
            onBlur={(event) => {
              if (!fieldErrors.description) return;
              const result = validateMinLength(event.target.value, 10, "Description");
              if (!result) {
                setFieldErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
          />
          <span
            data-show={Boolean(fieldErrors.description)}
            className="field-error text-xs normal-case text-red-600"
          >
            {fieldErrors.description ?? ""}
          </span>
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-[var(--font-heading)] border-b border-[var(--pp-border)] pb-3">
            Media
          </h3>
        </div>
        <div className="mt-4 grid gap-2 text-sm">
          <span className="admin-label">
            Images<RequiredMark />
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn-outline admin-btn admin-btn-size"
              onClick={() => {
                setLibraryOpen(true);
                setLibraryQuery("");
                setLibraryPage(1);
                setSelectedLibrary(new Set());
                setError(null);
              }}
            >
              Select from library
            </button>
            <div className="text-xs text-[var(--pp-muted)]">
              <div>• Max {maxFiles} images</div>
              <div>• Max 4 MB per image, Max 30 MB total</div>
              <div>• Min 800×1000, ratio 4:5</div>
            </div>
          </div>
        </div>
        <p
          data-show={Boolean(fieldErrors.images)}
          className="field-error mt-2 text-sm text-red-600"
        >
          {fieldErrors.images ?? ""}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {form.images.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {form.images.map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className={`group relative border border-[var(--pp-border)] bg-white transition-transform duration-200 ease-out ${
                  dragIndex === index ? "ring-2 ring-[var(--pp-gold)] scale-[0.98] opacity-80" : ""
                } ${
                  dropIndex === index && dragIndex !== index ? "ring-2 ring-[var(--pp-gold)]/40" : ""
                }`}
                style={{
                  transform:
                    dragIndex !== null && dragIndex === index
                      ? "scale(0.98)"
                      : dragIndex !== null && dragIndex !== index
                      ? "scale(0.995)"
                      : undefined,
                }}
                draggable
                onDragStart={() => {
                  setDragIndex(index);
                  setDropIndex(index);
                }}
                onDragEnd={() => {
                  setDragIndex(null);
                  setDropIndex(null);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (dropIndex !== index) setDropIndex(index);
                }}
                onDrop={() => {
                  if (dragIndex === null || dragIndex === index) return;
                  const next = [...form.images];
                  const [moved] = next.splice(dragIndex, 1);
                  next.splice(index, 0, moved);
                  updateImages(next);
                  setDragIndex(null);
                  setDropIndex(null);
                }}
              >
                {dropIndex === index && dragIndex !== index && (
                  <div className="pointer-events-none absolute inset-3 border-2 border-dashed border-[var(--pp-gold)]/50" />
                )}
                <div
                  className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--pp-beige)]/40 cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setPreviewItem({
                      url: image.url,
                      publicId: image.publicId ?? null,
                      title: `Product Image ${index + 1}`,
                    })
                  }
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    setPreviewItem({
                      url: image.url,
                      publicId: image.publicId ?? null,
                      title: `Product Image ${index + 1}`,
                    });
                  }}
                >
                  <span className="absolute left-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border border-[var(--pp-border)] bg-white/90 text-[var(--pp-muted)] opacity-0 transition group-hover:opacity-100">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <Image
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 240px"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center justify-between border-t border-[var(--pp-border)] px-3 py-2 text-xs text-[var(--pp-muted)]">
                  <span>Product Image {index + 1}</span>
                  {image.publicId && <span className="hidden sm:inline">Cloud</span>}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="admin-tooltip-trigger absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white opacity-0 backdrop-blur-md transition hover:bg-black/50 hover:border-red-300/70 hover:text-red-50 hover:shadow-[0_0_0_2px_rgba(239,68,68,0.25)] group-hover:opacity-100 group-focus-within:opacity-100"
                  aria-label="Remove image"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="admin-tooltip admin-tooltip--danger">Remove</span>
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            className="btn-outline admin-btn admin-btn-size"
            onClick={() => router.push("/admin/products")}
          >
            Back
          </button>
          <button
            type="submit"
            className="btn-primary admin-btn admin-btn-size"
            disabled={loading || uploading}
          >
            {loading ? "Saving…" : "Save product"}
          </button>
        </div>
      </form>
      <ToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))}
      />
      {libraryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setLibraryOpen(false)}
        >
          <div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
            <div
              className="w-full max-w-5xl bg-white rounded-lg shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="border-b border-[var(--pp-border)] px-6 py-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--pp-muted)]">Library</p>
                    <h3 className="text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">Select images</h3>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:flex-1 sm:flex-row sm:items-center sm:justify-end">
                    <input
                      value={libraryQuery}
                      onChange={(event) => setLibraryQuery(event.target.value)}
                      placeholder="Search media"
                      className="h-10 w-full border border-[var(--pp-border)] bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/30 sm:max-w-xs"
                    />
                  </div>
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-6">
                {libraryLoading ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {Array.from({ length: 10 }).map((_, idx) => (
                      <div key={idx} className="h-40 bg-[var(--pp-beige)]/40 animate-pulse" />
                    ))}
                  </div>
                ) : libraryItems.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[var(--pp-muted)]">
                    No media found.
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {libraryItems.map((item) => {
                      const selected = selectedLibrary.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className={`relative border cursor-pointer ${
                            selected ? "border-[4px] border-[var(--pp-gold)]" : "border-[var(--pp-border)]"
                          } group`}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleToggleLibrarySelection(item.id)}
                          onKeyDown={(event) => {
                            if (event.key !== "Enter" && event.key !== " ") return;
                            event.preventDefault();
                            handleToggleLibrarySelection(item.id);
                          }}
                        >
                          <div className="relative aspect-[4/5] w-full overflow-hidden bg-[var(--pp-beige)]/40 cursor-pointer">
                            <Image
                              src={item.url}
                              alt="Media"
                              fill
                              sizes="(max-width: 640px) 100vw, 200px"
                              className="object-cover"
                            />
                          </div>
                          {selected && (
                            <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pp-gold)] text-[var(--pp-ink)]">
                              <Check className="h-4 w-4" />
                            </span>
                          )}
                          <button
                            type="button"
                            className="admin-tooltip-trigger absolute top-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-black/35 text-white opacity-0 backdrop-blur-md transition hover:bg-black/50 hover:border-sky-200/70 hover:text-sky-50 hover:shadow-[0_0_0_2px_rgba(56,189,248,0.25)] group-hover:opacity-100 group-focus-within:opacity-100"
                            onClick={(event) => {
                              event.stopPropagation();
                              setPreviewItem({ url: item.url, publicId: item.publicId ?? null, title: "Media image" });
                            }}
                            aria-label="Preview"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" strokeWidth="1.6" strokeLinecap="round" />
                              <circle cx="12" cy="12" r="3" strokeWidth="1.6" />
                            </svg>
                            <span className="admin-tooltip admin-tooltip--info">
                              View
                            </span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--pp-border)] bg-[var(--pp-beige)]/40 px-6 py-4">
                <div className="text-xs text-[var(--pp-muted)]">
                  {selectedLibrary.size} selected
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    className="btn-outline admin-btn admin-btn-size"
                    onClick={() => setLibraryOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn-primary admin-btn admin-btn-size"
                    onClick={handleAddFromLibrary}
                    disabled={!selectedLibrary.size}
                  >
                    Add selected
                  </button>
                </div>
              </div>
              <div className="sticky bottom-0 border-t border-[var(--pp-border)] bg-white px-6 py-4 text-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs ${
                      libraryPage <= 1
                        ? "pointer-events-none border-[var(--pp-border)] text-[var(--pp-muted)]"
                        : "border-[var(--pp-border)] text-[var(--pp-ink)]"
                    }`}
                    onClick={() => setLibraryPage(Math.max(1, libraryPage - 1))}
                  >
                    Prev
                  </button>
                  <span className="text-xs text-[var(--pp-muted)]">
                    Page {libraryPage} of {totalLibraryPages}
                  </span>
                  <button
                    type="button"
                    className={`rounded-full border px-3 py-1 text-xs ${
                      libraryPage >= totalLibraryPages
                        ? "pointer-events-none border-[var(--pp-border)] text-[var(--pp-muted)]"
                        : "border-[var(--pp-border)] text-[var(--pp-ink)]"
                    }`}
                    onClick={() => setLibraryPage(Math.min(totalLibraryPages, libraryPage + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <AdminMediaViewer
        open={Boolean(previewItem)}
        item={
          previewItem
            ? {
                url: previewItem.url,
                title: previewItem.title ?? "Media preview",
                format: previewItem.url.split("?")[0].split("#")[0].split(".").pop() ?? null,
              }
            : null
        }
        onClose={() => setPreviewItem(null)}
      />
    </div>
  );
}
