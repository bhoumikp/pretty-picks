"use client";

import { useState } from "react";
import type { ProductSummary } from "@/types/catalog";
import ToastStack from "@/components/ui/toast-stack";
import { buildFieldErrors, validatePhone, validateRequired } from "@/lib/validation";
import { RequiredMark } from "@/components/admin/admin-form-helpers";
import AdminSelect from "@/components/admin/admin-select";

interface AdminOrdersProps {
  products: ProductSummary[];
  onCreated?: () => void;
  onError?: (message: string) => void;
  onCancel?: () => void;
  hideTitle?: boolean;
  variant?: "card" | "bare";
}

const emptyForm = {
  productId: "",
  customerName: "",
  phone: "",
  status: "Pending",
};

export default function AdminOrders({
  products,
  onCreated,
  onError,
  onCancel,
  hideTitle = false,
  variant = "card",
}: AdminOrdersProps) {
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
  const clearFieldError = (field: keyof typeof fieldErrors) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setToasts([]);
    setError(null);
    setFieldErrors({});

    const nextErrors = buildFieldErrors<"productId" | "customerName" | "phone">([
      { key: "productId", error: validateRequired(form.productId, "Product"), message: "Please select a product." },
      { key: "customerName", error: validateRequired(form.customerName, "Customer name") },
      { key: "phone", error: validatePhone(form.phone) },
    ]);

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setLoading(false);
      return;
    }

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      const message = "Unable to create order. Please try again.";
      setError(message);
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [
        ...prev,
        { id, type: "error", message },
      ]);
      onError?.(message);
      setLoading(false);
      return;
    }

    setForm(emptyForm);
    setLoading(false);
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, type: "success", message: "Order created." }]);
    onCreated?.();
  };

  const formMarkup = (
    <form onSubmit={handleSubmit} noValidate>
        {!hideTitle && (
          <h3 className="text-lg font-[var(--font-heading)]">Create manual order</h3>
        )}
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <label className="admin-label">
              Product
              <RequiredMark />
            </label>
            <AdminSelect
              value={form.productId}
              onChange={(nextValue) => {
                const nextProductId = String(nextValue);
                setForm({ ...form, productId: nextProductId });
                if (fieldErrors.productId && nextProductId) {
                  clearFieldError("productId");
                }
              }}
              options={[
                { value: "", label: "Select product" },
                ...products.map((product) => ({ value: product.id, label: product.name })),
              ]}
              fullWidth
              buttonClassName={`w-full admin-input ${fieldErrors.productId ? "is-error" : ""}`}
              header="Product"
              ariaLabel="Product"
            />
            <span
              data-show={Boolean(fieldErrors.productId)}
              className="field-error text-xs normal-case text-red-600"
            >
              {fieldErrors.productId ?? ""}
            </span>
          </div>
          <div className="grid gap-2">
            <label htmlFor="admin-order-customer" className="admin-label">
              Customer name
              <RequiredMark />
            </label>
            <input
              id="admin-order-customer"
              className={`admin-input ${fieldErrors.customerName ? "is-error" : ""}`}
              placeholder="Customer name"
              value={form.customerName}
              onChange={(event) => {
                setForm({ ...form, customerName: event.target.value });
                if (fieldErrors.customerName) clearFieldError("customerName");
              }}
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
            <label htmlFor="admin-order-phone" className="admin-label">
              Phone number
              <RequiredMark />
            </label>
            <input
              id="admin-order-phone"
              className={`admin-input ${fieldErrors.phone ? "is-error" : ""}`}
              placeholder="Phone number"
              value={form.phone}
              onChange={(event) => {
                setForm({ ...form, phone: event.target.value });
                if (fieldErrors.phone) clearFieldError("phone");
              }}
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
          <div className="grid gap-2">
            <label className="admin-label">Status</label>
            <AdminSelect
              value={form.status}
              onChange={(nextValue) => setForm({ ...form, status: String(nextValue) })}
              options={[
                { value: "Pending", label: "Pending" },
                { value: "Confirmed", label: "Confirmed" },
                { value: "Shipped", label: "Shipped" },
                { value: "Delivered", label: "Delivered" },
              ]}
              fullWidth
              buttonClassName="w-full admin-input"
              header="Status"
              ariaLabel="Status"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-3">
          {onCancel && (
            <button type="button" className="btn-outline admin-btn admin-btn-size" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary admin-btn admin-btn-size" disabled={loading}>
            {loading ? "Saving…" : "Create order"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <ToastStack
        toasts={toasts}
        onClose={(id) => setToasts((prev) => prev.filter((toast) => toast.id !== id))}
      />
    </form>
  );

  if (variant === "bare") {
    return <>{formMarkup}</>;
  }

  return <div className="soft-card p-6">{formMarkup}</div>;
}
