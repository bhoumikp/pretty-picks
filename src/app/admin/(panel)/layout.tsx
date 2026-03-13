import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: {
    default: "Admin",
    absolute: "Admin",
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-[var(--pp-beige)]">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-[var(--pp-border)] bg-white/80 px-6 py-4 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--pp-muted)]">
                Admin panel
              </p>
              <h1 className="mt-2 text-xl font-[var(--font-heading)] text-[var(--pp-ink)]">
                Pretty Picks
              </h1>
            </div>
            <form action="/api/auth/signout" method="post">
              <button className="btn-outline text-sm">Sign out</button>
            </form>
          </div>
        </header>
        <main className="flex-1 px-6 py-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
