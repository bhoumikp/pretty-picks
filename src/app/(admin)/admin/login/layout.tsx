export const metadata = {
  title: { absolute: "Admin | Login" },
};

import "../(panel)/admin.css";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/admin");
  }
  return children;
}
