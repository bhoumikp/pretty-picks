import { formatDate } from "@/lib/utils";
import AdminTable from "@/components/admin/admin-table";

interface ContactRow {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export default function AdminContacts({ contacts }: { contacts: ContactRow[] }) {
  const headers = ["Name", "Email", "Message", "Date"];
  const rows = contacts.map((contact) => [
    contact.name,
    contact.email,
    contact.message,
    formatDate(new Date(contact.createdAt)),
  ]);

  return <AdminTable headers={headers} rows={rows} />;
}
