import { AdminLayout } from "@/components/admin/layout-wrapper";
import { MonitoringContent } from "./monitoring-content";

export default async function AdminMonitoring() {
  return (
    <AdminLayout>
      <MonitoringContent />
    </AdminLayout>
  );
}
