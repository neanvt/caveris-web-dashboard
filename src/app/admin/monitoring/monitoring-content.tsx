"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Shield,
} from "lucide-react";

interface Stats {
  activeVerifiers: number;
  pendingVerifications: number;
  completedToday: number;
  failedToday: number;
}

export function MonitoringContent() {
  const [stats, setStats] = useState<Stats>({
    activeVerifiers: 0,
    pendingVerifications: 0,
    completedToday: 0,
    failedToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const { getMonitoringStats } = await import("@/app/actions/supabase-actions");
      const data = await getMonitoringStats();

      if (data) {
        setStats(data);
      }
    } catch (error) {
      console.error("Error loading monitoring stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const recentActivity = [
    {
      type: "success",
      message: "Face verification successful",
      detail: "ROLL000123 - Candidate verified",
      time: "2 minutes ago",
      verifier: "Verifier #45",
    },
    {
      type: "warning",
      message: "Low confidence score",
      detail: "ROLL000456 - Score: 72%",
      time: "5 minutes ago",
      verifier: "Verifier #23",
    },
    {
      type: "error",
      message: "Fingerprint mismatch",
      detail: "ROLL000789 - Retry required",
      time: "8 minutes ago",
      verifier: "Verifier #67",
    },
    {
      type: "success",
      message: "Iris scan completed",
      detail: "ROLL000234 - Candidate verified",
      time: "12 minutes ago",
      verifier: "Verifier #89",
    },
  ];

  const activeLocations = [
    { centre: "Delhi Centre - North", active: 12, total: 15, completion: 78 },
    { centre: "Mumbai Centre - West", active: 8, total: 10, completion: 92 },
    { centre: "Bangalore Centre", active: 15, total: 20, completion: 65 },
    { centre: "Chennai Centre - South", active: 6, total: 8, completion: 85 },
  ];

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Live Monitoring
            <span className="ml-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              Live
            </span>
          </h1>
          <p className="text-gray-600">Real-time verification tracking</p>
        </div>
        <p className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Verifiers
                </p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {stats.activeVerifiers}
                </p>
                <p className="mt-1 text-xs text-gray-500">Currently online</p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="mt-2 text-3xl font-bold text-yellow-600">
                  {stats.pendingVerifications}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Awaiting verification
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Completed Today
                </p>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {stats.completedToday}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Successful verifications
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Failed Today
                </p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {stats.failedToday}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Verification failures
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Real-time Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 rounded-lg border-l-4 p-3 ${
                    activity.type === "success"
                      ? "border-l-green-500 bg-green-50"
                      : activity.type === "warning"
                        ? "border-l-yellow-500 bg-yellow-50"
                        : "border-l-red-500 bg-red-50"
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {activity.message}
                    </p>
                    <p className="text-sm text-gray-600">{activity.detail}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                      <span>{activity.time}</span>
                      <span>•</span>
                      <span>{activity.verifier}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Centres */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Active Centres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeLocations.map((location, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {location.centre}
                      </p>
                      <p className="text-sm text-gray-600">
                        {location.active} of {location.total} verifiers active
                      </p>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {location.completion}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-green-600 transition-all"
                      style={{ width: `${location.completion}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
