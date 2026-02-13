import { AdminLayout } from "@/components/admin/layout-wrapper";
import { CandidatesContent } from "./candidates-content";

export const dynamic = "force-dynamic";

export default async function AdminCandidates() {
  return (
    <AdminLayout>
      <CandidatesContent />
    </AdminLayout>
  );
}
