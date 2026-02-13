import { AdminLayout } from "@/components/admin/layout-wrapper";
import { ExamCentresContent } from "./centres-content";

export const dynamic = 'force-dynamic';

export default async function ExamCentresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <AdminLayout>
      <ExamCentresContent examId={id} />
    </AdminLayout>
  );
}
