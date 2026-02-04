import { AdminLayout } from "@/components/admin/layout-wrapper";
import { BulkAssignmentContent } from "./bulk-assign-content";

export default async function BulkAssignPage() {
  return (
    <AdminLayout>
      <BulkAssignmentContent />
    </AdminLayout>
  );
}
