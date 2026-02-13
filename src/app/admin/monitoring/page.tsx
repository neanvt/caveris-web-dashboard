import { AdminLayout } from "@/components/admin/layout-wrapper";
import { MonitoringContent } from "./monitoring-content";

export const dynamic = 'force-dynamic';

export default async function AdminMonitoring() {
  return (
    <AdminLayout>
      <MonitoringContent />
    </AdminLayout>
  );
}
