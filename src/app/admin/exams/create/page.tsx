import { AdminLayout } from "@/components/admin/layout-wrapper";
import { CreateExamContent } from "./create-exam-content";

export const dynamic = 'force-dynamic';

export default async function CreateExamPage() {
  return (
    <AdminLayout>
      <CreateExamContent />
    </AdminLayout>
  );
}
