import { AdminLayout } from "@/components/admin/layout-wrapper";
import { VerifiersContent } from "./verifiers-content";

export default async function AdminVerifiers() {
  return (
    <AdminLayout>
      <VerifiersContent />
    </AdminLayout>
  );
}
