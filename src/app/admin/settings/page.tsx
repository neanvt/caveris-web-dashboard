import { AdminLayout } from "@/components/admin/layout-wrapper";
import { SettingsContent } from "./settings-content";

export default async function AdminSettings() {
  return (
    <AdminLayout>
      <SettingsContent />
    </AdminLayout>
  );
}
