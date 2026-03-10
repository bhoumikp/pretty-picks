"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const response = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/admin",
    });

    if (response?.error) setError("Invalid credentials");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--pp-beige)] px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow">
        <h1 className="text-2xl font-[var(--font-heading)]">Admin Login</h1>
        <p className="mt-2 text-sm text-[var(--pp-muted)]">
          Sign in to manage Pretty Picks.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
          />
          <input
            name="password"
            type="password"
            required
            placeholder="Password"
            className="rounded-2xl border border-[var(--pp-border)] px-4 py-3 text-sm"
          />
          <button
            type="submit"
            className="rounded-full bg-[var(--pp-gold)] px-5 py-3 text-sm font-semibold text-white"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
}
