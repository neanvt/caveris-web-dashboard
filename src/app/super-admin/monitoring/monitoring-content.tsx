"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Smartphone,
  MapPin,
  Clock,
  Users,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

export function MonitoringContent() {
  const liveVerifications = [
    {
      id: 1,
      candidate: "Rahul Sharma",
      verifier: "Verifier #234",
      exam: "Civil Services",
      centre: "Delhi Centre 01",
      method: "Face",
      status: "success",
      time: "2 seconds ago",
    },
    {
      id: 2,
      candidate: "Priya Patel",
      verifier: "Verifier #156",
      exam: "Banking Recruitment",
      centre: "Mumbai Centre 03",
      method: "Fingerprint",
      status: "success",
      time: "5 seconds ago",
    },
    {
      id: 3,
      candidate: "Amit Kumar",
      verifier: "Verifier #089",
      exam: "Medical Entrance",
      centre: "Bangalore Centre 02",
      method: "Face",
      status: "failed",
      time: "12 seconds ago",
    },
    {
      id: 4,
      candidate: "Sneha Reddy",
      verifier: "Verifier #312",
      exam: "Engineering Entrance",
      centre: "Hyderabad Centre 01",
      method: "Iris",
      status: "success",
      time: "18 seconds ago",
    },
  ];

  const activeVerifiers = [
    {
      id: "#234",
      name: "Rajesh Kumar",
      exam: "Civil Services",
      centre: "Delhi Centre 01",
      verified: 45,
      location: "Delhi, India",
      lastActive: "1 min ago",
      status: "online",
    },
    {
      id: "#156",
      name: "Anjali Mehta",
      exam: "Banking Recruitment",
      centre: "Mumbai Centre 03",
      verified: 38,
      location: "Mumbai, India",
      lastActive: "2 min ago",
      status: "online",
    },
    {
      id: "#089",
      name: "Vikram Singh",
      exam: "Medical Entrance",
      centre: "Bangalore Centre 02",
      verified: 52,
      location: "Bangalore, India",
      lastActive: "5 min ago",
      status: "online",
    },
    {
      id: "#312",
      name: "Pooja Sharma",
      exam: "Engineering Entrance",
      centre: "Hyderabad Centre 01",
      verified: 41,
      location: "Hyderabad, India",
      lastActive: "3 min ago",
      status: "online",
    },
  ];

  const systemAlerts = [
    {
      type: "warning",
      message: "High failure rate detected at Delhi Centre 01",
      time: "5 minutes ago",
    },
    {
      type: "info",
      message: "Bulk import completed: 2,345 candidates",
      time: "15 minutes ago",
    },
    {
      type: "success",
      message: "All verifiers synced successfully",
      time: "30 minutes ago",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Live Monitoring Dashboard
        </h1>
        <p className="text-gray-600">
          Real-time verification tracking and system status
        </p>
      </div>

      {/* Live Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Verifiers</p>
                <p className="mt-1 text-3xl font-bold">24</p>
                <p className="mt-1 text-xs text-gray-500">Online now</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verifications Today</p>
                <p className="mt-1 text-3xl font-bold text-green-600">1,234</p>
                <p className="mt-1 text-xs text-gray-500">+156 in last hour</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="mt-1 text-3xl font-bold text-orange-600">89</p>
                <p className="mt-1 text-xs text-gray-500">
                  In verification queue
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Failed Today</p>
                <p className="mt-1 text-3xl font-bold text-red-600">23</p>
                <p className="mt-1 text-xs text-gray-500">1.8% failure rate</p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Live Verification Feed */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Live Verification Feed
                <span className="ml-2 flex h-2 w-2">
                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {liveVerifications.map((verification) => (
                  <div
                    key={verification.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {verification.candidate}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            verification.status === "success"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {verification.status === "success" ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {verification.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                        <span>{verification.exam}</span>
                        <span>•</span>
                        <span>{verification.centre}</span>
                        <span>•</span>
                        <span className="capitalize">
                          {verification.method}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        By {verification.verifier} • {verification.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Alerts */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                System Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemAlerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`rounded-lg border-l-2 p-3 ${
                      alert.type === "warning"
                        ? "border-l-orange-500 bg-orange-50"
                        : alert.type === "success"
                          ? "border-l-green-500 bg-green-50"
                          : "border-l-blue-500 bg-blue-50"
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-900">
                      {alert.message}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">{alert.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Active Verifiers */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-blue-600" />
            Active Verifiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-gray-600">
                  <th className="pb-3">Verifier</th>
                  <th className="pb-3">Assignment</th>
                  <th className="pb-3">Location</th>
                  <th className="pb-3 text-right">Verified Today</th>
                  <th className="pb-3 text-right">Last Active</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeVerifiers.map((verifier) => (
                  <tr key={verifier.id} className="border-b last:border-0">
                    <td className="py-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {verifier.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {verifier.id}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-600">
                      <p className="font-medium">{verifier.exam}</p>
                      <p className="text-xs text-gray-500">{verifier.centre}</p>
                    </td>
                    <td className="py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {verifier.location}
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {verifier.verified}
                      </span>
                    </td>
                    <td className="py-4 text-right text-sm text-gray-600">
                      {verifier.lastActive}
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                        Online
                      </span>
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
