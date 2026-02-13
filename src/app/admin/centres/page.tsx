import { AdminLayout } from "@/components/admin/layout-wrapper";
import { CentresContent } from "./centres-content";

export const dynamic = 'force-dynamic';

export default async function AdminCentres() {
  return (
    <AdminLayout>
      <CentresContent />
    </AdminLayout>
  );
}
