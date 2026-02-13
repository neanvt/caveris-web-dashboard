import { SuperAdminLayout } from "@/components/super-admin/layout-wrapper";
import { DashboardContent } from "./dashboard-content";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  return (
    <SuperAdminLayout>
      <DashboardContent />
    </SuperAdminLayout>
  );
}
