import { getServerSession } from "next-auth";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/admin-shell";
import { authOptions } from "@/lib/auth";
import "./admin.css";

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

	const host = (await headers()).get("host")?.split(":")[0] ?? "";
	if (process.env.NODE_ENV === "production" && host !== "admin.shopprettypicks.in") {
		redirect("https://shopprettypicks.in");
	}

	const cookieStore = await cookies();
	const collapsedCookie = cookieStore.get("pp-admin-sidebar-collapsed");
	const initialCollapsed = collapsedCookie?.value === "1";

	return <AdminShell initialCollapsed={initialCollapsed}>{children}</AdminShell>;
}
