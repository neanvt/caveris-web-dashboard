"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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
  Plus,
  FileText,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Activity,
  AlertCircle,
  Upload,
  UserPlus,
  Eye,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface Stats {
  totalExams: number;
  activeExams: number;
  totalCandidates: number;
  verifiedToday: number;
  pendingVerifications: number;
  activeVerifiers: number;
}

export function AdminDashboardContent() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalExams: 0,
    activeExams: 0,
    totalCandidates: 0,
    verifiedToday: 0,
    pendingVerifications: 0,
    activeVerifiers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { getDashboardStats } = await import("@/app/actions/supabase-actions");
      const data = await getDashboardStats();

      if (data) {
        setStats({
          totalExams: data.totalExams,
          activeExams: data.activeExams,
          totalCandidates: data.totalCandidates,
          verifiedToday: data.verifiedToday,
          pendingVerifications: data.pendingVerifications,
          activeVerifiers: data.activeVerifiers,
        });
      }
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sample data for charts (using real stats where available)
  const verificationTrend = [
    {
      date: "19 Jan",
      verified: Math.floor(stats.verifiedToday * 0.2),
      pending: 56,
    },
    {
      date: "20 Jan",
      verified: Math.floor(stats.verifiedToday * 0.4),
      pending: 43,
    },
    {
      date: "21 Jan",
      verified: Math.floor(stats.verifiedToday * 0.6),
      pending: 32,
    },
    {
      date: "22 Jan",
      verified: Math.floor(stats.verifiedToday * 0.8),
      pending: 28,
    },
    {
      date: "23 Jan",
      verified: stats.verifiedToday,
      pending: stats.pendingVerifications,
    },
  ];

  const examStatus = [
    { name: "Ongoing", value: stats.activeExams, color: "#10b981" },
    {
      name: "Scheduled",
      value: Math.floor((stats.totalExams - stats.activeExams) * 0.5),
      color: "#f59e0b",
    },
    {
      name: "Draft",
      value: Math.floor((stats.totalExams - stats.activeExams) * 0.3),
      color: "#6b7280",
    },
    {
      name: "Completed",
      value: Math.floor((stats.totalExams - stats.activeExams) * 0.2),
      color: "#3b82f6",
    },
  ].filter((item) => item.value > 0);

  const verificationMethods = [
    { method: "Face", count: 234 },
    { method: "Fingerprint", count: 189 },
    { method: "Iris", count: 67 },
    { method: "Aadhaar", count: 45 },
  ];

  const recentActivity = [
    {
      action: "Candidate import completed",
      detail: "245 candidates added to Civil Services Exam",
      time: "5 minutes ago",
      type: "success",
    },
    {
      action: "Verifier assigned",
      detail: "Verifier #123 assigned to Delhi Centre",
      time: "15 minutes ago",
      type: "info",
    },
    {
      action: "Manager created",
      detail: "New manager account for Mumbai Centre",
      time: "1 hour ago",
      type: "success",
    },
    {
      action: "Low verification rate",
      detail: "Centre ABC showing 65% completion",
      time: "2 hours ago",
      type: "warning",
    },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Manage your exams and verifications</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/admin/exams/create" as any)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Exam
          </Button>
          <Button
            onClick={() => {
              // TODO: Implement import functionality
              console.log("Import candidates");
            }}
            variant="outline"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Candidates
          </Button>
        </div>
      </div>

      {/* Key Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Exams</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.totalExams}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.activeExams} active now
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <FileText className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
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
                  Across all exams
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Verified Today
                </p>
                <p className="mt-2 text-3xl font-bold text-purple-600">
                  {stats.verifiedToday}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {stats.pendingVerifications} pending
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <CheckCircle className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Verification Trend
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
                  dataKey="verified"
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Exam Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={examStatus}
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
                  {examStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Verification Methods */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Verification Methods Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
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

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button
              onClick={() => router.push("/admin/exams/create" as any)}
              variant="outline"
              className="h-auto flex-col py-4"
            >
              <Plus className="mb-2 h-6 w-6 text-green-600" />
              <span className="font-medium">Create New Exam</span>
              <span className="text-xs text-gray-500">Set up exam details</span>
            </Button>
            <Button
              onClick={() => {
                // TODO: Implement import functionality
                console.log("Import candidates");
              }}
              variant="outline"
              className="h-auto flex-col py-4"
            >
              <Upload className="mb-2 h-6 w-6 text-blue-600" />
              <span className="font-medium">Import Candidates</span>
              <span className="text-xs text-gray-500">
                Bulk CSV/Excel upload
              </span>
            </Button>
            <Button
              onClick={() => {
                // TODO: Navigate to verifiers page
                router.push("/admin/verifiers" as any);
              }}
              variant="outline"
              className="h-auto flex-col py-4"
            >
              <UserPlus className="mb-2 h-6 w-6 text-purple-600" />
              <span className="font-medium">Create Verifier</span>
              <span className="text-xs text-gray-500">Add new verifier</span>
            </Button>
            <Button
              onClick={() => router.push("/admin/monitoring" as any)}
              variant="outline"
              className="h-auto flex-col py-4"
            >
              <Eye className="mb-2 h-6 w-6 text-orange-600" />
              <span className="font-medium">View Live Monitoring</span>
              <span className="text-xs text-gray-500">Real-time tracking</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start justify-between border-l-2 border-l-green-500 pl-4"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.detail}</p>
                  <p className="mt-1 text-xs text-gray-500">{activity.time}</p>
                </div>
                <span
                  className={`ml-4 rounded-full px-3 py-1 text-xs font-medium ${
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
