import { SuperAdminLayout } from "@/components/super-admin/layout-wrapper";
import { MonitoringContent } from "./monitoring-content";

export const dynamic = 'force-dynamic';

export default async function MonitoringPage() {
  return (
    <SuperAdminLayout>
      <MonitoringContent />
    </SuperAdminLayout>
  );
}
