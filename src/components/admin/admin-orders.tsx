"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductSummary } from "@/types/catalog";
import { formatDate } from "@/lib/utils";
import Toast from "@/components/ui/toast";
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
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setToast(null);

    const productError = validateRequired(form.productId, "Product");
    if (productError) {
      setToast({ type: "error", message: "Please select a product." });
      setLoading(false);
      return;
    }
    const nameError = validateRequired(form.customerName, "Customer name");
    if (nameError) {
      setToast({ type: "error", message: nameError.message });
      setLoading(false);
      return;
    }
    const phoneError = validatePhone(form.phone);
    if (phoneError) {
      setToast({ type: "error", message: phoneError.message });
      setLoading(false);
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      setToast({ type: "error", message: "Unable to create order. Please try again." });
      setLoading(false);
      return;
    }

    setForm(emptyForm);
    setLoading(false);
    setToast({ type: "success", message: "Order created." });
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this order?")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="grid gap-8">
      <form onSubmit={handleSubmit} className="soft-card rounded-3xl p-6" noValidate>
        <h3 className="text-lg font-[var(--font-heading)]">Add manual order</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <select
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
            value={form.productId}
            onChange={(event) => setForm({ ...form, productId: event.target.value })}
          >
            <option value="">Select product</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
          <input
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
            placeholder="Customer name"
            value={form.customerName}
            onChange={(event) => setForm({ ...form, customerName: event.target.value })}
          />
          <input
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
            placeholder="Phone number"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
          <select
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
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
      </form>

      <div className="soft-card rounded-3xl p-6">
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
