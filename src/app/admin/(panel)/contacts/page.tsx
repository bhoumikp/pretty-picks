import { prisma } from "@/lib/prisma";
import AdminContacts from "@/components/admin/admin-contacts";

export const revalidate = 0;

export default async function AdminContactsPage() {
  const contacts = await prisma.contact.findMany({
    orderBy: { createdAt: "desc" },
  });
  const serialized = contacts.map((contact) => ({
    ...contact,
    createdAt: contact.createdAt.toISOString(),
  }));

  return (
    <div className="soft-card rounded-3xl p-6">
      <h3 className="text-lg font-[var(--font-heading)]">Contact messages</h3>
      <div className="mt-4">
        <AdminContacts contacts={serialized} />
      </div>
    </div>
  );
}
