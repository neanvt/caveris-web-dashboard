import { SuperAdminLayout } from "@/components/super-admin/layout-wrapper";
import { MonitoringContent } from "./monitoring-content";

export default async function MonitoringPage() {
  return (
    <SuperAdminLayout>
      <MonitoringContent />
    </SuperAdminLayout>
  );
}
