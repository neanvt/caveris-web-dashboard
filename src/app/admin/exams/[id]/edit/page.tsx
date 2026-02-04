import { AdminLayout } from "@/components/admin/layout-wrapper";
import { EditExamContent } from "./edit-exam-content";

export default async function EditExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminLayout>
      <EditExamContent examId={id} />
    </AdminLayout>
  );
}
