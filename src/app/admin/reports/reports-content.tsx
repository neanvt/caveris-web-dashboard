"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  Calendar,
  Users,
  CheckCircle,
  BarChart3,
} from "lucide-react";

export function ReportsContent() {
  const reports = [
    {
      title: "Verification Summary Report",
      description: "Complete verification statistics and summary",
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Candidate Performance Report",
      description: "Detailed candidate verification status",
      icon: Users,
      color: "blue",
    },
    {
      title: "Centre-wise Report",
      description: "Verification statistics by centre",
      icon: BarChart3,
      color: "purple",
    },
    {
      title: "Exam Summary Report",
      description: "Overall exam statistics and insights",
      icon: FileText,
      color: "orange",
    },
    {
      title: "Daily Activity Report",
      description: "Day-wise verification activity",
      icon: Calendar,
      color: "indigo",
    },
    {
      title: "Verifier Performance Report",
      description: "Individual verifier statistics",
      icon: BarChart3,
      color: "pink",
    },
  ];

  const handleDownload = (format: string, reportName: string) => {
    alert(`Downloading ${reportName} as ${format.toUpperCase()}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">
          Generate and download comprehensive reports
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Reports
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reports.length}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Generated Today
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600">5</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Download className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Last Generated
                </p>
                <p className="mt-2 text-lg font-bold text-gray-900">
                  2 hours ago
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {reports.map((report, index) => {
          const Icon = report.icon;
          const colorClasses = {
            green: "bg-green-100 text-green-600",
            blue: "bg-blue-100 text-blue-600",
            purple: "bg-purple-100 text-purple-600",
            orange: "bg-orange-100 text-orange-600",
            indigo: "bg-indigo-100 text-indigo-600",
            pink: "bg-pink-100 text-pink-600",
          }[report.color];

          return (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-3 ${colorClasses}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <p className="mt-1 text-sm text-gray-600">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownload("pdf", report.title)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownload("excel", report.title)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Excel
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownload("csv", report.title)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Report Generation Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-gray-900">Scheduled Reports</p>
                <p className="text-sm text-gray-600">
                  Automatically generate reports daily/weekly
                </p>
              </div>
              <Button variant="outline">Configure</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-gray-900">Custom Date Range</p>
                <p className="text-sm text-gray-600">
                  Generate reports for specific time periods
                </p>
              </div>
              <Button variant="outline">Select Dates</Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <p className="font-medium text-gray-900">Email Reports</p>
                <p className="text-sm text-gray-600">
                  Send reports to your email automatically
                </p>
              </div>
              <Button variant="outline">Setup Email</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
