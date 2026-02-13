import { SuperAdminLayout } from "@/components/super-admin/layout-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ExamsPage() {
  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">All Exams</h1>
          <p className="text-gray-600">
            View all exams across all organizations
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              System-wide Exams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>Exam list will be displayed here</p>
              <p className="text-sm mt-2">Coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
