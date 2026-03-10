"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CategorySummary } from "@/types/catalog";

interface AdminCategoriesProps {
  categories: CategorySummary[];
}

const emptyForm = { id: "", name: "", image: "" };

export default function AdminCategories({ categories }: AdminCategoriesProps) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const payload = { name: form.name, image: form.image };
    const method = form.id ? "PATCH" : "POST";
    const url = form.id ? `/api/categories/${form.id}` : "/api/categories";

    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setForm(emptyForm);
    setLoading(false);
    router.refresh();
  };

  const handleEdit = (category: CategorySummary) => {
    setForm({
      id: category.id,
      name: category.name,
      image: category.image ?? "",
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="grid gap-8">
      <form onSubmit={handleSubmit} className="soft-card rounded-3xl p-6">
        <h3 className="text-lg font-[var(--font-heading)]">
          {form.id ? "Edit category" : "Add new category"}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
            placeholder="Category name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
          <input
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
            placeholder="Image URL"
            value={form.image}
            onChange={(event) => setForm({ ...form, image: event.target.value })}
          />
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            className="rounded-full bg-[var(--pp-gold)] px-6 py-3 text-sm font-semibold text-white"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save category"}
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
        <h3 className="text-lg font-[var(--font-heading)]">Categories</h3>
        <div className="mt-4 space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--pp-border)] pb-4"
            >
              <div>
                <p className="text-sm font-semibold">{category.name}</p>
                <p className="text-xs text-[var(--pp-muted)]">/{category.slug}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="rounded-full border border-[var(--pp-border)] px-4 py-2 text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
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
