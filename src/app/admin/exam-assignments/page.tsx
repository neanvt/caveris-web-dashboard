import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ExamAssignmentContent } from "./exam-assignment-content";

export default async function ExamAssignmentPage() {
  return (
    <AdminLayout>
      <ExamAssignmentContent />
    </AdminLayout>
  );
}
