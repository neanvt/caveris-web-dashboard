import { AdminLayout } from "@/components/admin/layout-wrapper";
import { CandidatesContent } from "./candidates-content";

export default async function AdminCandidates() {
  return (
    <AdminLayout>
      <CandidatesContent />
    </AdminLayout>
  );
}
