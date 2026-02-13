import { SuperAdminLayout } from "@/components/super-admin/layout-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database } from "lucide-react";
export const dynamic = 'force-dynamic';
export default async function LogsPage() {
  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600">Audit logs and system activity</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-gray-500">
              <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>System logs will be displayed here</p>
              <p className="text-sm mt-2">Coming soon...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
