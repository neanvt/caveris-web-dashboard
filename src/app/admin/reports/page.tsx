import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ReportsContent } from "./reports-content";

export const dynamic = 'force-dynamic';

export default async function AdminReports() {
  return (
    <AdminLayout>
      <ReportsContent />
    </AdminLayout>
  );
}
