"use client";

import { useState } from "react";
import type { ProductSummary } from "@/types/catalog";
import ToastStack from "@/components/ui/toast-stack";
import { validatePhone, validateRequired } from "@/lib/validation";
import AdminSelect from "@/components/admin/admin-select";

interface AdminOrdersProps {
  products: ProductSummary[];
  onCreated?: () => void;
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
    onCreated?.();
  };

  const formMarkup = (
    <form onSubmit={handleSubmit} noValidate>
        {!hideTitle && (
          <h3 className="text-lg font-[var(--font-heading)]">Create manual order</h3>
        )}
        <div className="mt-4 grid gap-4">
          <div className="grid gap-2">
            <AdminSelect
              value={form.productId}
              onChange={(nextValue) => {
                const nextProductId = String(nextValue);
                setForm({ ...form, productId: nextProductId });
                if (fieldErrors.productId && nextProductId) {
                  setFieldErrors((prev) => ({ ...prev, productId: undefined }));
                }
              }}
              options={[
                { value: "", label: "Select product" },
                ...products.map((product) => ({ value: product.id, label: product.name })),
              ]}
              fullWidth
              buttonClassName={`w-full border px-4 py-3 text-sm ${
                fieldErrors.productId ? "border-red-300" : "border-[var(--pp-border)]"
              }`}
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
            <input
              className={`border px-4 py-3 text-sm ${
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
              className={`border px-4 py-3 text-sm ${
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
            buttonClassName="w-full border border-[var(--pp-border)] px-4 py-3 text-sm"
            header="Status"
            ariaLabel="Status"
          />
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
