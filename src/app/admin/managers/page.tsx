import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ManagersContent } from "./managers-content";

export default async function AdminManagers() {
  return (
    <AdminLayout>
      <ManagersContent />
    </AdminLayout>
  );
}
