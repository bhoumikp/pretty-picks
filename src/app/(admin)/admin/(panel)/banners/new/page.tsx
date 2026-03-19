import AdminBannerForm from "@/components/admin/admin-banner-form";

export const metadata = {
	title: { absolute: "Admin | Add Banner" },
};

export default function AdminBannerCreatePage() {
	return <AdminBannerForm mode="create" />;
}
