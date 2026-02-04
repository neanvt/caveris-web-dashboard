"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  Filter,
  Calendar,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export function ReportsContent() {
  const [dateRange, setDateRange] = useState("last7days");

  // Sample data
  const verificationByDay = [
    { day: "Mon", successful: 234, failed: 12 },
    { day: "Tue", successful: 432, failed: 18 },
    { day: "Wed", successful: 567, failed: 23 },
    { day: "Thu", successful: 789, failed: 15 },
    { day: "Fri", successful: 654, failed: 21 },
    { day: "Sat", successful: 543, failed: 19 },
    { day: "Sun", successful: 321, failed: 14 },
  ];

  const methodDistribution = [
    { name: "Face Recognition", value: 1234, color: "#3b82f6" },
    { name: "Fingerprint", value: 876, color: "#10b981" },
    { name: "Iris", value: 456, color: "#f59e0b" },
    { name: "Aadhaar", value: 234, color: "#8b5cf6" },
  ];

  const examPerformance = [
    {
      exam: "Civil Services 2026",
      candidates: 5432,
      verified: 5234,
      pending: 198,
      rate: 96.4,
    },
    {
      exam: "Banking Recruitment",
      candidates: 3876,
      verified: 3654,
      pending: 222,
      rate: 94.3,
    },
    {
      exam: "Medical Entrance",
      candidates: 2341,
      verified: 2198,
      pending: 143,
      rate: 93.9,
    },
    {
      exam: "Engineering Entrance",
      candidates: 1523,
      verified: 1432,
      pending: 91,
      rate: 94.0,
    },
  ];

  const handleExport = (format: string) => {
    // TODO: Implement actual export
    alert(`Exporting report in ${format} format...`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <p className="text-gray-600">Comprehensive reports and data exports</p>
      </div>

      {/* Export Options */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Export Reports</span>
            <div className="flex gap-2">
              <Button
                onClick={() => handleExport("PDF")}
                variant="outline"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button
                onClick={() => handleExport("Excel")}
                variant="outline"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button>
              <Button
                onClick={() => handleExport("CSV")}
                variant="outline"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full rounded-lg border p-2"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thismonth">This Month</option>
                <option value="lastmonth">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Exam</label>
              <select className="w-full rounded-lg border p-2">
                <option>All Exams</option>
                <option>Civil Services 2026</option>
                <option>Banking Recruitment</option>
                <option>Medical Entrance</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Admin</label>
              <select className="w-full rounded-lg border p-2">
                <option>All Admins</option>
                <option>Exam Board A</option>
                <option>Exam Board B</option>
                <option>Exam Board C</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Verifications</p>
                <p className="mt-1 text-2xl font-bold">2,800</p>
                <p className="mt-1 flex items-center text-xs text-green-600">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +12.5%
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="mt-1 text-2xl font-bold text-green-600">94.6%</p>
                <p className="mt-1 text-xs text-gray-500">2,652 successful</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed</p>
                <p className="mt-1 text-2xl font-bold text-red-600">148</p>
                <p className="mt-1 text-xs text-gray-500">5.4% failure rate</p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Verifiers</p>
                <p className="mt-1 text-2xl font-bold">156</p>
                <p className="mt-1 text-xs text-gray-500">Across all exams</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Verification Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={verificationByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="successful"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="failed"
                  stroke="#ef4444"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verification Methods Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={methodDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {methodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Exam Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Exam Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-gray-600">
                  <th className="pb-3">Exam Name</th>
                  <th className="pb-3 text-right">Total Candidates</th>
                  <th className="pb-3 text-right">Verified</th>
                  <th className="pb-3 text-right">Pending</th>
                  <th className="pb-3 text-right">Success Rate</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {examPerformance.map((exam, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-4 font-medium text-gray-900">
                      {exam.exam}
                    </td>
                    <td className="py-4 text-right text-gray-600">
                      {exam.candidates.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-green-600">
                        {exam.verified.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-orange-600">
                        {exam.pending.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {exam.rate}%
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Button variant="outline" size="sm">
                        <Download className="mr-1 h-3 w-3" />
                        Export
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
