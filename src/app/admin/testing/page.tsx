import { AdminLayout } from "@/components/admin/layout-wrapper";
import { TestingExamContent } from "./testing-exam-content";

export const dynamic = "force-dynamic";

export default async function TestingExamPage() {
  return (
    <AdminLayout>
      <TestingExamContent />
    </AdminLayout>
  );
}
