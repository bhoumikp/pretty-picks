import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/admin-sidebar";
import { authOptions } from "@/lib/auth";

export const metadata = {
  title: {
    template: "Admin | %s",
    default: "Admin",
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
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-[var(--pp-border)] bg-white px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--pp-muted)]">
              Admin panel
            </p>
            <h1 className="text-xl font-[var(--font-heading)]">Pretty Picks</h1>
          </div>
          <form action="/api/auth/signout" method="post">
            <button className="rounded-full border border-[var(--pp-border)] px-4 py-2 text-sm">
              Sign out
            </button>
          </form>
        </header>
        <main className="px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
