import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ExamsContent } from "./exams-content";

export const dynamic = 'force-dynamic';

export default async function AdminExams() {
  return (
    <AdminLayout>
      <ExamsContent />
    </AdminLayout>
  );
}
