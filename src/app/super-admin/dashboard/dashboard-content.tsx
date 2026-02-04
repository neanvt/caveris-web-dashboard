"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  CheckCircle2,
  Activity,
  AlertCircle,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  totalExams: number;
  totalCandidates: number;
  totalVerified: number;
  totalUsers: number;
  activeExams: number;
  todayVerifications: number;
}

export function DashboardContent() {
  const [stats, setStats] = useState<Stats>({
    totalExams: 0,
    totalCandidates: 0,
    totalVerified: 0,
    totalUsers: 0,
    activeExams: 0,
    todayVerifications: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const supabase = createClient();

    const [
      exams,
      candidates,
      verified,
      users,
      activeExams,
      todayVerifications,
    ] = await Promise.all([
      supabase.from("exams").select("*", { count: "exact", head: true }),
      supabase.from("candidates").select("*", { count: "exact", head: true }),
      supabase
        .from("verifications")
        .select("*", { count: "exact", head: true })
        .eq("verified", true),
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase
        .from("exams")
        .select("*", { count: "exact", head: true })
        .eq("status", "ongoing"),
      supabase
        .from("verifications")
        .select("*", { count: "exact", head: true })
        .gte("created_at", new Date().toISOString().split("T")[0]),
    ]);

    setStats({
      totalExams: exams.count || 0,
      totalCandidates: candidates.count || 0,
      totalVerified: verified.count || 0,
      totalUsers: users.count || 0,
      activeExams: activeExams.count || 0,
      todayVerifications: todayVerifications.count || 0,
    });
    setLoading(false);
  };

  // Sample data for charts
  const verificationTrend = [
    { date: "19 Jan", verifications: 234 },
    { date: "20 Jan", verifications: 432 },
    { date: "21 Jan", verifications: 567 },
    { date: "22 Jan", verifications: 789 },
    { date: "23 Jan", verifications: stats.todayVerifications },
  ];

  const examsByStatus = [
    { name: "Ongoing", value: stats.activeExams, color: "#3b82f6" },
    {
      name: "Scheduled",
      value: Math.floor(stats.totalExams * 0.3),
      color: "#f59e0b",
    },
    {
      name: "Completed",
      value: Math.floor(stats.totalExams * 0.5),
      color: "#10b981",
    },
    {
      name: "Draft",
      value: Math.floor(stats.totalExams * 0.2),
      color: "#6b7280",
    },
  ];

  const verificationMethods = [
    { method: "Face", count: 456 },
    { method: "Fingerprint", count: 234 },
    { method: "Iris", count: 89 },
    { method: "Aadhaar", count: 123 },
  ];

  const topAdmins = [
    { name: "Exam Board A", exams: 15, candidates: 4523, verified: 4234 },
    { name: "Exam Board B", exams: 12, candidates: 3876, verified: 3654 },
    { name: "Exam Board C", exams: 8, candidates: 2341, verified: 2198 },
    { name: "Exam Board D", exams: 6, candidates: 1523, verified: 1432 },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">System Overview</h1>
        <p className="text-gray-600">
          Real-time monitoring of all examinations and verifications
        </p>
      </div>

      {/* Key Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Exams</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.totalExams}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.activeExams} active now
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Candidates
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.totalCandidates.toLocaleString()}
                </p>
                <p className="mt-1 flex items-center text-xs text-green-600">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  +12% from last week
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Successfully Verified
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.totalVerified.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.todayVerifications} today
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.totalUsers}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Admins, managers, verifiers
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <Shield className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Verification Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Verification Trend (Last 5 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={verificationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="verifications"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Exams by Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Exams by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={examsByStatus}
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
                  {examsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Verification Methods Chart */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Verification Methods Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={verificationMethods}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Admins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Top Performing Admins
            </span>
            <button className="text-sm text-blue-600 hover:underline">
              View All
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-gray-600">
                  <th className="pb-3">Organization</th>
                  <th className="pb-3 text-right">Exams</th>
                  <th className="pb-3 text-right">Candidates</th>
                  <th className="pb-3 text-right">Verified</th>
                  <th className="pb-3 text-right">Success Rate</th>
                </tr>
              </thead>
              <tbody>
                {topAdmins.map((admin, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-4 font-medium text-gray-900">
                      {admin.name}
                    </td>
                    <td className="py-4 text-right text-gray-600">
                      {admin.exams}
                    </td>
                    <td className="py-4 text-right text-gray-600">
                      {admin.candidates.toLocaleString()}
                    </td>
                    <td className="py-4 text-right text-gray-600">
                      {admin.verified.toLocaleString()}
                    </td>
                    <td className="py-4 text-right">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {((admin.verified / admin.candidates) * 100).toFixed(1)}
                        %
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Recent System Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                action: "New exam created",
                user: "Exam Board A",
                time: "2 minutes ago",
                type: "success",
              },
              {
                action: "Bulk verification completed",
                user: "Verifier #234",
                time: "15 minutes ago",
                type: "info",
              },
              {
                action: "Admin account created",
                user: "System",
                time: "1 hour ago",
                type: "success",
              },
              {
                action: "High failure rate detected",
                user: "Centre XYZ",
                time: "2 hours ago",
                type: "warning",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-l-2 border-l-blue-500 pl-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">
                    {activity.user} • {activity.time}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    activity.type === "success"
                      ? "bg-green-100 text-green-800"
                      : activity.type === "warning"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {activity.type}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
