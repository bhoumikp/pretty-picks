"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductSummary } from "@/types/catalog";
import { formatDate } from "@/lib/utils";
import ToastStack from "@/components/ui/toast-stack";
import { validatePhone, validateRequired } from "@/lib/validation";

interface OrderRow {
  id: string;
  customerName: string;
  phone: string;
  status: string;
  createdAt: string;
  product?: ProductSummary | null;
}

interface AdminOrdersProps {
  orders: OrderRow[];
  products: ProductSummary[];
}

const emptyForm = {
  productId: "",
  customerName: "",
  phone: "",
  status: "Pending",
};

export default function AdminOrders({ orders, products }: AdminOrdersProps) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type?: "success" | "error" | "warning" | "primary" }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    productId?: string;
    customerName?: string;
    phone?: string;
  }>({});

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setToasts([]);
    setError(null);
    setFieldErrors({});

    const productError = validateRequired(form.productId, "Product");
    if (productError) {
      setFieldErrors({ productId: "Please select a product." });
      setLoading(false);
      return;
    }
    const nameError = validateRequired(form.customerName, "Customer name");
    if (nameError) {
      setFieldErrors({ customerName: nameError.message });
      setLoading(false);
      return;
    }
    const phoneError = validatePhone(form.phone);
    if (phoneError) {
      setFieldErrors({ phone: phoneError.message });
      setLoading(false);
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      setError("Unable to create order. Please try again.");
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [
        ...prev,
        { id, type: "error", message: "Unable to create order. Please try again." },
      ]);
      setLoading(false);
      return;
    }

    setForm(emptyForm);
    setLoading(false);
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type: "success", message: "Order created." }]);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="grid gap-8">
      <form onSubmit={handleSubmit} className="soft-card rounded-2xl p-6" noValidate>
        <h3 className="text-lg font-[var(--font-heading)]">Add manual order</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <select
              className={`admin-select rounded-lg border px-4 py-3 text-sm ${
                fieldErrors.productId ? "border-red-300" : "border-[var(--pp-border)]"
              }`}
              value={form.productId}
              onChange={(event) => setForm({ ...form, productId: event.target.value })}
              onBlur={(event) => {
                if (!fieldErrors.productId) return;
                const result = validateRequired(event.target.value, "Product");
                if (!result) {
                  setFieldErrors((prev) => ({ ...prev, productId: undefined }));
                }
              }}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <span
              data-show={Boolean(fieldErrors.productId)}
              className="field-error text-xs normal-case text-red-600"
            >
              {fieldErrors.productId ?? ""}
            </span>
          </div>
          <div className="grid gap-2">
            <input
              className={`rounded-lg border px-4 py-3 text-sm ${
                fieldErrors.customerName ? "border-red-300" : "border-[var(--pp-border)]"
              }`}
              placeholder="Customer name"
              value={form.customerName}
              onChange={(event) => setForm({ ...form, customerName: event.target.value })}
              onBlur={(event) => {
                if (!fieldErrors.customerName) return;
                const result = validateRequired(event.target.value, "Customer name");
                if (!result) {
                  setFieldErrors((prev) => ({ ...prev, customerName: undefined }));
                }
              }}
            />
            <span
              data-show={Boolean(fieldErrors.customerName)}
              className="field-error text-xs normal-case text-red-600"
            >
              {fieldErrors.customerName ?? ""}
            </span>
          </div>
          <div className="grid gap-2">
            <input
              className={`rounded-lg border px-4 py-3 text-sm ${
                fieldErrors.phone ? "border-red-300" : "border-[var(--pp-border)]"
              }`}
              placeholder="Phone number"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              onBlur={(event) => {
                if (!fieldErrors.phone) return;
                const result = validatePhone(event.target.value);
                if (!result) {
                  setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                }
              }}
            />
            <span
              data-show={Boolean(fieldErrors.phone)}
              className="field-error text-xs normal-case text-red-600"
            >
              {fieldErrors.phone ?? ""}
            </span>
          </div>
          <select
            className="admin-select rounded-lg border border-[var(--pp-border)] px-4 py-3 text-sm"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-full bg-[var(--pp-gold)] px-6 py-3 text-sm font-semibold text-white"
          disabled={loading}
        >
          {loading ? "Saving…" : "Create order"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </form>

      <div className="soft-card rounded-2xl p-6">
        <h3 className="text-lg font-[var(--font-heading)]">Orders</h3>
        <div className="mt-4 space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--pp-border)] pb-4"
            >
              <div>
                <p className="text-sm font-semibold">{order.product?.name}</p>
                <p className="text-xs text-[var(--pp-muted)]">
                  {order.customerName} · {order.phone}
                </p>
                <p className="text-xs text-[var(--pp-muted)]">
                  {formatDate(new Date(order.createdAt))} · {order.status}
                </p>
              </div>
              <button
                onClick={() => handleDelete(order.id)}
                className="rounded-full border border-red-200 px-4 py-2 text-xs text-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
      <ToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))}
      />
    </div>
  );
}
