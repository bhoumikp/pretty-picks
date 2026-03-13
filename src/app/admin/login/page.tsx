"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { siteConfig } from "@/data/site";
import Toast from "@/components/ui/toast";
import { validateEmail, validateMinLength } from "@/lib/validation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [passwordValue, setPasswordValue] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setToast(null);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ email: emailError.message });
      setLoading(false);
      return;
    }
    const passwordError = validateMinLength(password, 8, "Password");
    if (passwordError) {
      setFieldErrors({ password: passwordError.message });
      setLoading(false);
      return;
    }

    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/admin",
    });

    if (response?.error) {
      const friendly =
        response.error === "EMAIL_NOT_FOUND"
          ? "We couldn’t find that email."
          : response.error === "INVALID_PASSWORD"
          ? "That password is incorrect."
          : "We couldn’t sign you in. Check your email and password.";
      setError(friendly);
      if (response.error === "EMAIL_NOT_FOUND") {
        setFieldErrors({ email: friendly });
      } else if (response.error === "INVALID_PASSWORD") {
        setFieldErrors({ password: friendly });
      }
      setToast({ type: "error", message: friendly });
      setLoading(false);
      return;
    }
    setToast({ type: "success", message: "Welcome back. Redirecting…" });
    router.push("/admin");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--pp-beige)] px-4">
      <div className="mx-auto grid w-full max-w-4xl overflow-hidden bg-white shadow-lg md:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden flex-col justify-between bg-[var(--pp-ink)]/95 p-10 text-white md:flex">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/60">Admin</p>
            <h1 className="mt-4 text-3xl font-[var(--font-heading)]">
              {siteConfig.name}
            </h1>
            <p className="mt-3 text-sm text-white/70">
              Manage products, orders, and storefront content in one place.
            </p>
          </div>
          <div className="text-xs text-white/60">
            Secure access for authorized staff only.
          </div>
        </div>
        <div className="p-8 md:p-10">
          <div className="md:hidden">
            <p className="text-xs uppercase tracking-[0.4em] text-[var(--pp-muted)]">Admin</p>
            <h1 className="mt-3 text-2xl font-[var(--font-heading)]">
              {siteConfig.name}
            </h1>
          </div>
          <h2 className="mt-6 text-xl font-semibold md:mt-0">Sign in</h2>
          <p className="mt-2 text-sm text-[var(--pp-muted)]">
            Use your admin credentials to continue.
          </p>
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4" noValidate>
            <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
              Email
                <input
                  name="email"
                  type="email"
                  placeholder="Enter Email"
                  className={`border bg-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pp-gold)]/40 ${
                    fieldErrors.email
                      ? "border-red-300 focus:ring-red-300/40"
                      : "border-[var(--pp-border)]"
                  }`}
                  onBlur={(event) => {
                    if (!fieldErrors.email) return;
                    const result = validateEmail(event.target.value);
                    if (!result) {
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }
                  }}
                />
              <span
                data-show={Boolean(fieldErrors.email)}
                className="field-error text-xs normal-case text-red-600"
              >
                {fieldErrors.email ?? ""}
              </span>
            </label>
            <label className="grid gap-2 text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
              Password
              <div
                className={`flex items-center border bg-white px-4 py-2 ${
                  fieldErrors.password
                    ? "border-red-300"
                    : "border-[var(--pp-border)]"
                }`}
              >
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter Password"
                  className="w-full bg-transparent py-1 pr-2 text-sm focus:outline-none"
                  value={passwordValue}
                  onChange={(event) => setPasswordValue(event.target.value)}
                  onBlur={(event) => {
                    if (!fieldErrors.password) return;
                    const result = validateMinLength(event.target.value, 6, "Password");
                    if (!result) {
                      setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    }
                  }}
                />
                {passwordValue && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="flex h-8 w-8 items-center justify-center text-[var(--pp-muted)] transition-colors hover:text-[var(--pp-gold)]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 3l18 18" strokeWidth="1.6" strokeLinecap="round" />
                        <path
                          d="M10.6 10.6a2.5 2.5 0 0 0 3.5 3.5"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                        <path
                          d="M9 5.2A9.6 9.6 0 0 1 12 5c5.2 0 9.5 4.2 10.5 7-0.4 1-1.4 2.8-3.2 4.4"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                        <path
                          d="M6.2 7.1C4.2 8.6 2.8 10.6 1.5 12c1 2.8 5.3 7 10.5 7 1.1 0 2.1-0.2 3.1-0.6"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path
                          d="M1.5 12c1-2.8 5.3-7 10.5-7s9.5 4.2 10.5 7c-1 2.8-5.3 7-10.5 7s-9.5-4.2-10.5-7z"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                        />
                        <circle cx="12" cy="12" r="3.2" strokeWidth="1.6" />
                      </svg>
                    )}
                  </button>
                )}
              </div>
              <span
                data-show={Boolean(fieldErrors.password)}
                className="field-error text-xs normal-case text-red-600"
              >
                {fieldErrors.password ?? ""}
              </span>
            </label>
              <button
                type="submit"
                className="btn-primary btn-sweep text-sm"
                disabled={loading}
              >
                <span className="btn-sweep-label">
                  {loading ? "Signing in…" : "Login"}
                </span>
              </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        </div>
      </div>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
