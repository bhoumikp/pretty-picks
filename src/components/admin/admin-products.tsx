"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { CategorySummary, ProductImage } from "@/types/catalog";
import ToastStack from "@/components/ui/toast-stack";
import { validateMinLength, validateNumberMin, validateRequired, validateUrlOptional } from "@/lib/validation";
import AdminSelect from "@/components/admin/admin-select";

interface AdminProductFormProps {
  categories: CategorySummary[];
  initialProduct?: {
    id: string;
    name: string;
    price: number;
    description: string;
    material: string;
    images: ProductImage[];
    featured: boolean;
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
  featured: false,
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
      featured: initialProduct.featured,
      stock: String(initialProduct.stock),
      categoryId: initialProduct.categoryId,
    };
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualUrl, setManualUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type?: "success" | "error" | "warning" | "primary" }>
  >([]);
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

  const maxFiles = 6;
  const maxSizeMb = 4;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setToasts([]);
    setError(null);
    setFieldErrors({});

    const nameError = validateRequired(form.name, "Product name");
    if (nameError) {
      setFieldErrors({ name: nameError.message });
      setLoading(false);
      return;
    }
    const priceValue = Number(form.price);
    const priceError = validateNumberMin(priceValue, 1, "Price");
    if (priceError) {
      setFieldErrors({ price: priceError.message });
      setLoading(false);
      return;
    }
    const materialError = validateRequired(form.material, "Material");
    if (materialError) {
      setFieldErrors({ material: materialError.message });
      setLoading(false);
      return;
    }
    const stockValue = Number(form.stock || 0);
    const stockError = validateNumberMin(stockValue, 0, "Stock");
    if (stockError) {
      setFieldErrors({ stock: stockError.message });
      setLoading(false);
      return;
    }
    const categoryError = validateRequired(form.categoryId, "Category");
    if (categoryError) {
      setFieldErrors({ categoryId: "Please select a category." });
      setLoading(false);
      return;
    }
    const descriptionError = validateMinLength(form.description, 10, "Description");
    if (descriptionError) {
      setFieldErrors({ description: descriptionError.message });
      setLoading(false);
      return;
    }
    if (!form.images.length) {
      setFieldErrors({ images: "Please add at least one product image." });
      setLoading(false);
      return;
    }

    const payload = {
      name: form.name,
      price: Number(form.price),
      description: form.description,
      material: form.material,
      images: form.images,
      featured: form.featured,
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

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;
    if (form.images.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed.`);
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [
        ...prev,
        { id, type: "error", message: `Maximum ${maxFiles} images allowed.` },
      ]);
      event.target.value = "";
      return;
    }

    const invalidType = files.find((file) => !file.type.startsWith("image/"));
    if (invalidType) {
      setError("Only image files are allowed.");
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [
        ...prev,
        { id, type: "error", message: "Only image files are allowed." },
      ]);
      event.target.value = "";
      return;
    }

    const tooLarge = files.find((file) => file.size > maxSizeMb * 1024 * 1024);
    if (tooLarge) {
      setError(`Each file must be under ${maxSizeMb}MB.`);
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [
        ...prev,
        { id, type: "error", message: `Each file must be under ${maxSizeMb}MB.` },
      ]);
      event.target.value = "";
      return;
    }
    setUploading(true);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    try {
      const uploads = await new Promise<ProductImage[]>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/uploads");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => {
          setUploadProgress(0);
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve(data.uploads as ProductImage[]);
          } else {
            reject(new Error("Upload failed"));
          }
        };
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(formData);
      });

      setForm({ ...form, images: [...form.images, ...uploads] });
    } catch (uploadError) {
      setError("Upload failed. Please try again.");
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [
        ...prev,
        { id, type: "error", message: "Upload failed. Please try again." },
      ]);
      console.error(uploadError);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleAddManualUrl = () => {
    const urlError = validateUrlOptional(manualUrl, "Image URL");
    if (urlError) {
      setFieldErrors({ imageUrl: urlError.message });
      return;
    }
    if (!manualUrl.trim()) return;
    setForm({
      ...form,
      images: [...form.images, { url: manualUrl.trim() }],
    });
    setManualUrl("");
  };

  const handleRemoveImage = async (index: number) => {
    const image = form.images[index];
    if (image?.publicId) {
      await fetch("/api/uploads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId: image.publicId }),
      });
    }
    setForm({ ...form, images: form.images.filter((_, idx) => idx !== index) });
  };

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="soft-card p-6" noValidate>
        <h3 className="text-lg font-[var(--font-heading)]">
          {form.id ? "Edit product" : "Add new product"}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="admin-product-name" className="text-xs font-semibold text-[var(--pp-muted)]">
              Product name
            </label>
            <input
              id="admin-product-name"
              className={`border px-4 py-3 text-sm ${
                fieldErrors.name ? "border-red-300" : "border-[var(--pp-border)]"
              }`}
              placeholder="Product name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
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
            <label htmlFor="admin-product-price" className="text-xs font-semibold text-[var(--pp-muted)]">
              Price
            </label>
            <input
              id="admin-product-price"
              className={`border px-4 py-3 text-sm ${
                fieldErrors.price ? "border-red-300" : "border-[var(--pp-border)]"
              }`}
              placeholder="Price"
              type="number"
              value={form.price}
              onChange={(event) => setForm({ ...form, price: event.target.value })}
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
            <label htmlFor="admin-product-material" className="text-xs font-semibold text-[var(--pp-muted)]">
              Material
            </label>
            <input
              id="admin-product-material"
              className={`border px-4 py-3 text-sm ${
                fieldErrors.material ? "border-red-300" : "border-[var(--pp-border)]"
              }`}
              placeholder="Material"
              value={form.material}
              onChange={(event) => setForm({ ...form, material: event.target.value })}
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
            <label htmlFor="admin-product-stock" className="text-xs font-semibold text-[var(--pp-muted)]">
              Stock
            </label>
            <input
              id="admin-product-stock"
              className={`border px-4 py-3 text-sm ${
                fieldErrors.stock ? "border-red-300" : "border-[var(--pp-border)]"
              }`}
              placeholder="Stock"
              type="number"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
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
          <div className="grid gap-2">
            <label className="text-xs font-semibold text-[var(--pp-muted)]">Category</label>
            <AdminSelect
              value={form.categoryId}
              onChange={(nextValue) => {
                const nextCategoryId = String(nextValue);
                setForm({ ...form, categoryId: nextCategoryId });
                if (fieldErrors.categoryId && nextCategoryId) {
                  setFieldErrors((prev) => ({ ...prev, categoryId: undefined }));
                }
              }}
              options={[
                { value: "", label: "Select category" },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
              fullWidth
              buttonClassName={`w-full border px-4 py-3 text-sm ${
                fieldErrors.categoryId ? "border-red-300" : "border-[var(--pp-border)]"
              }`}
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
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(event) =>
                setForm({ ...form, featured: event.target.checked })
              }
            />
            Featured
          </label>
        </div>
        <div className="mt-4 grid gap-2">
          <label htmlFor="admin-product-description" className="text-xs font-semibold text-[var(--pp-muted)]">
            Description
          </label>
          <textarea
            id="admin-product-description"
            className={`w-full border px-4 py-3 text-sm ${
              fieldErrors.description ? "border-red-300" : "border-[var(--pp-border)]"
            }`}
            placeholder="Description"
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
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
        <div className="mt-4 grid gap-2 text-sm">
          <span className="text-xs font-semibold text-[var(--pp-muted)]">Images</span>
          <div className="flex flex-wrap items-center gap-3">
            <label className="border border-[var(--pp-border)] px-4 py-2 cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
            {uploading ? "Uploading..." : "Upload images"}
          </label>
            {uploading && (
              <div className="h-2 w-40 overflow-hidden bg-[var(--pp-beige)]">
                <div
                  className="h-full bg-[var(--pp-gold)]"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            <span className="text-xs text-[var(--pp-muted)]">
              Max {maxFiles} images, {maxSizeMb}MB each.
            </span>
          </div>
        </div>
        <p
          data-show={Boolean(fieldErrors.images)}
          className="field-error mt-2 text-sm text-red-600"
        >
          {fieldErrors.images ?? ""}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="grid flex-1 gap-2">
            <label htmlFor="admin-product-image-url" className="text-xs font-semibold text-[var(--pp-muted)]">
              Add image URL
            </label>
            <input
              id="admin-product-image-url"
              className={`w-full border px-4 py-3 text-sm ${
                fieldErrors.imageUrl ? "border-red-300" : "border-[var(--pp-border)]"
              }`}
              placeholder="Paste image URL"
              value={manualUrl}
              onChange={(event) => setManualUrl(event.target.value)}
              onBlur={(event) => {
                if (!fieldErrors.imageUrl) return;
                const result = validateUrlOptional(event.target.value, "Image URL");
                if (!result) {
                  setFieldErrors((prev) => ({ ...prev, imageUrl: undefined }));
                }
              }}
            />
            <span
              data-show={Boolean(fieldErrors.imageUrl)}
              className="field-error text-xs normal-case text-red-600"
            >
              {fieldErrors.imageUrl ?? ""}
            </span>
          </div>
          <button
            type="button"
            onClick={handleAddManualUrl}
            className="border border-[var(--pp-border)] px-4 py-2 text-xs"
          >
            Add URL
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {form.images.length > 0 && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {form.images.map((image, index) => (
              <div
                key={`${image.url}-${index}`}
                className="border border-[var(--pp-border)] bg-white p-2"
              >
                <div className="relative h-24 w-full overflow-hidden rounded-lg">
                  <Image
                    src={image.url}
                    alt={`Product image ${index + 1}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 240px"
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="mt-2 w-full rounded-full border border-red-200 px-3 py-1 text-xs text-red-600"
                >
                  Delete image
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
    </div>
  );
}
