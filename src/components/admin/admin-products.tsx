"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { CategorySummary, ProductImage, ProductSummary } from "@/types/catalog";

interface AdminProductsProps {
  products: Array<
    ProductSummary & {
      images: ProductImage[];
      description: string;
      material: string;
      featured: boolean;
      stock: number;
      categoryId: string;
    }
  >;
  categories: CategorySummary[];
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

export default function AdminProducts({ products, categories }: AdminProductsProps) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [manualUrl, setManualUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const maxFiles = 6;
  const maxSizeMb = 4;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

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

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setForm(emptyForm);
    setLoading(false);
    router.refresh();
  };

  const handleEdit = (product: AdminProductsProps["products"][number]) => {
    setForm({
      id: product.id,
      name: product.name,
      price: String(product.price),
      description: product.description,
      material: product.material,
      images: product.images ?? [],
      featured: product.featured,
      stock: String(product.stock),
      categoryId: product.categoryId,
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.refresh();
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = event.target.files ? Array.from(event.target.files) : [];
    if (!files.length) return;
    if (form.images.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} images allowed.`);
      event.target.value = "";
      return;
    }

    const invalidType = files.find((file) => !file.type.startsWith("image/"));
    if (invalidType) {
      setError("Only image files are allowed.");
      event.target.value = "";
      return;
    }

    const tooLarge = files.find((file) => file.size > maxSizeMb * 1024 * 1024);
    if (tooLarge) {
      setError(`Each file must be under ${maxSizeMb}MB.`);
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
      console.error(uploadError);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleAddManualUrl = () => {
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
    <div className="grid gap-8">
      <form onSubmit={handleSubmit} className="soft-card rounded-3xl p-6">
        <h3 className="text-lg font-[var(--font-heading)]">
          {form.id ? "Edit product" : "Add new product"}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
            placeholder="Product name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <input
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={(event) => setForm({ ...form, price: event.target.value })}
            required
          />
          <input
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
            placeholder="Material"
            value={form.material}
            onChange={(event) => setForm({ ...form, material: event.target.value })}
            required
          />
          <input
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
            placeholder="Stock"
            type="number"
            value={form.stock}
            onChange={(event) => setForm({ ...form, stock: event.target.value })}
            required
          />
          <select
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
            value={form.categoryId}
            onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
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
        <textarea
          className="mt-4 w-full rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
          placeholder="Description"
          rows={3}
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          required
        />
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <label className="rounded-full border border-[var(--pp-border)] px-4 py-2">
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
            <div className="h-2 w-40 overflow-hidden rounded-full bg-[var(--pp-beige)]">
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
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className="flex-1 rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
            placeholder="Paste image URL"
            value={manualUrl}
            onChange={(event) => setManualUrl(event.target.value)}
          />
          <button
            type="button"
            onClick={handleAddManualUrl}
            className="rounded-full border border-[var(--pp-border)] px-4 py-2 text-xs"
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
                className="rounded-2xl border border-[var(--pp-border)] bg-white p-2"
              >
                <div className="relative h-24 w-full overflow-hidden rounded-xl">
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
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-full bg-[var(--pp-gold)] px-6 py-3 text-sm font-semibold text-white"
            disabled={loading || uploading}
          >
            {loading ? "Saving..." : "Save product"}
          </button>
          {form.id && (
            <button
              type="button"
              className="rounded-full border border-[var(--pp-border)] px-6 py-3 text-sm"
              onClick={() => setForm(emptyForm)}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <div className="soft-card rounded-3xl p-6">
        <h3 className="text-lg font-[var(--font-heading)]">Products list</h3>
        <div className="mt-4 space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--pp-border)] pb-4"
            >
              <div>
                <p className="text-sm font-semibold">{product.name}</p>
                <p className="text-xs text-[var(--pp-muted)]">
                  ₹{product.price} · {product.category?.name}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(product)}
                  className="rounded-full border border-[var(--pp-border)] px-4 py-2 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="rounded-full border border-red-200 px-4 py-2 text-xs text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
