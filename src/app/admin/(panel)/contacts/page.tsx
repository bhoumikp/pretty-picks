import { prisma } from "@/lib/prisma";
import AdminContacts from "@/components/admin/admin-contacts";
import OfflineBanner from "@/components/admin/offline-banner";

export const revalidate = 0;
export const metadata = {
  title: { absolute: "Admin | Contacts" },
};

export default async function AdminContactsPage() {
  let contacts: Array<
    Awaited<ReturnType<typeof prisma.contact.findMany>>[number]
  > = [];
  let dbUnavailable = false;

  try {
    contacts = await prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Admin contacts DB error:", error);
    dbUnavailable = true;
  }

  const serialized = contacts.map((contact) => ({
    ...contact,
    createdAt: contact.createdAt.toISOString(),
  }));

  return (
    <div className="soft-card p-6">
      <h3 className="text-lg font-[var(--font-heading)]">Contact messages</h3>
      {dbUnavailable && (
        <div className="mt-3">
          <OfflineBanner />
        </div>
      )}
      <div className="mt-4">
        <AdminContacts contacts={serialized} />
      </div>
    </div>
  );
}
