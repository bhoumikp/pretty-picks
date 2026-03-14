"use client";

import { useContext, useEffect, useRef, useState } from "react";
import type { ProductSummary } from "@/types/catalog";
import AdminOrdersClient from "@/components/admin/admin-orders-client";
import AdminOrders from "@/components/admin/admin-orders";
import { ToastContext } from "@/components/admin/admin-toast-provider";

interface OrderRow {
  id: string;
  productName?: string | null;
  customerName: string;
  phone: string;
  status: string;
  createdAt: string;
}

interface AdminOrdersPanelProps {
  initialOrders: OrderRow[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
  initialQuery: string;
  initialSort: string[];
  initialDir: Array<"asc" | "desc">;
  initialStatus: "all" | "Pending" | "Confirmed" | "Shipped" | "Delivered";
  products: ProductSummary[];
}

export default function AdminOrdersPanel({
  initialOrders,
  initialTotal,
  initialPage,
  pageSize,
  initialQuery,
  initialSort,
  initialDir,
  initialStatus,
  products,
}: AdminOrdersPanelProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const refreshRef = useRef<null | ((options?: { resetPage?: boolean }) => void)>(null);
  const toastContext = useContext(ToastContext);

  const handleClose = () => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      setModalOpen(false);
    }, 320);
  };

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  return (
    <>
      <AdminOrdersClient
        initialOrders={initialOrders}
        initialTotal={initialTotal}
        initialPage={initialPage}
        pageSize={pageSize}
        initialQuery={initialQuery}
        initialSort={initialSort}
        initialDir={initialDir}
        initialStatus={initialStatus}
        onOpenCreate={() => {
          setClosing(false);
          setModalOpen(true);
        }}
        registerRefresh={(fn) => {
          refreshRef.current = fn;
        }}
      />

      {modalOpen && (
        <div
          className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ease-out ${
            closing ? "opacity-0" : "opacity-100"
          }`}
          onClick={handleClose}
        >
          <div className="flex h-full w-full items-center justify-center px-4 lg:pl-[var(--admin-sidebar-offset)] lg:pr-0">
            <div
              className={`w-full max-w-lg bg-white p-6 shadow-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
                closing ? "translate-y-6 scale-[0.96] opacity-0" : "translate-y-0 scale-100 opacity-100"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-[var(--font-heading)]">Create manual order</h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex h-9 w-9 items-center justify-center text-[var(--pp-muted)] transition hover:text-[var(--pp-ink)]"
                  aria-label="Close modal"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M6 6l12 12" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M18 6l-12 12" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-4">
                <AdminOrders
                  products={products}
                  onCreated={() => {
                    handleClose();
                    refreshRef.current?.({ resetPage: true });
                    toastContext?.pushToast({ message: "Order created.", type: "success" });
                  }}
                  onError={(message) => {
                    toastContext?.pushToast({ message, type: "error" });
                  }}
                  onCancel={handleClose}
                  hideTitle
                  variant="bare"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
