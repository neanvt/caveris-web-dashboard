import { AdminLayout } from "@/components/admin/layout-wrapper";
import { SettingsContent } from "./settings-content";

export const dynamic = 'force-dynamic';

export default async function AdminSettings() {
  return (
    <AdminLayout>
      <SettingsContent />
    </AdminLayout>
  );
}
