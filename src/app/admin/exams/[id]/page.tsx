import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ViewExamContent } from "./view-exam-content";

export const dynamic = 'force-dynamic';

export default async function ViewExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminLayout>
      <ViewExamContent examId={id} />
    </AdminLayout>
  );
}
