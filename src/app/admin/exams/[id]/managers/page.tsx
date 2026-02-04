import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ExamManagersContent } from "./managers-content";

export default async function ExamManagersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminLayout>
      <ExamManagersContent examId={id} />
    </AdminLayout>
  );
}
