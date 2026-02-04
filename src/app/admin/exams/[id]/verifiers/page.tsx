import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ExamVerifiersContent } from "./verifiers-content";

export default async function ExamVerifiersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminLayout>
      <ExamVerifiersContent examId={id} />
    </AdminLayout>
  );
}
