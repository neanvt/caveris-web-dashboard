import { SuperAdminLayout } from "@/components/super-admin/layout-wrapper";
import { ReportsContent } from "./reports-content";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  return (
    <SuperAdminLayout>
      <ReportsContent />
    </SuperAdminLayout>
  );
}
