import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ReportsContent } from "./reports-content";

export default async function AdminReports() {
  return (
    <AdminLayout>
      <ReportsContent />
    </AdminLayout>
  );
}
