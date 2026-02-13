import { AdminLayout } from "@/components/admin/layout-wrapper";
import ShiftsContent from "./shifts-content";

export const dynamic = 'force-dynamic';

export default async function AdminShifts() {
  return (
    <AdminLayout>
      <ShiftsContent />
    </AdminLayout>
  );
}
