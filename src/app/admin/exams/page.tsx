import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ExamsContent } from "./exams-content";

export default async function AdminExams() {
  return (
    <AdminLayout>
      <ExamsContent />
    </AdminLayout>
  );
}
