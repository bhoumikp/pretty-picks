import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/admin-shell";
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

  return <AdminShell>{children}</AdminShell>;
}
