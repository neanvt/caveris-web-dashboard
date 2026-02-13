import { AdminLayout } from "@/components/admin/layout-wrapper";
import { VerifiersContent } from "./verifiers-content";

export const dynamic = 'force-dynamic';

export default async function AdminVerifiers() {
  return (
    <AdminLayout>
      <VerifiersContent />
    </AdminLayout>
  );
}
