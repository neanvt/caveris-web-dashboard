import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ExamCandidatesContent } from "./candidates-content";

export const dynamic = 'force-dynamic';

export default async function ExamCandidatesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminLayout>
      <ExamCandidatesContent examId={id} />
    </AdminLayout>
  );
}
