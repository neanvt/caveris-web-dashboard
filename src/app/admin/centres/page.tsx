import { AdminLayout } from "@/components/admin/layout-wrapper";
import { CentresContent } from "./centres-content";

export default async function AdminCentres() {
  return (
    <AdminLayout>
      <CentresContent />
    </AdminLayout>
  );
}
