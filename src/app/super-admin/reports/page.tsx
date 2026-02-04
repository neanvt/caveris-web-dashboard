import { SuperAdminLayout } from "@/components/super-admin/layout-wrapper";
import { ReportsContent } from "./reports-content";

export default async function ReportsPage() {
  return (
    <SuperAdminLayout>
      <ReportsContent />
    </SuperAdminLayout>
  );
}
