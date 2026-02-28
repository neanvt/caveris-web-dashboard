"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  MapPin,
  Shield,
  RefreshCw,
  Users,
  BarChart3,
} from "lucide-react";
import {
  getMonitoringStats,
  getRecentVerificationActivity,
  getActiveCentres,
} from "@/app/actions/supabase-actions";

interface Stats {
  activeVerifiers: number;
  pendingVerifications: number;
  completedToday: number;
  failedToday: number;
}

interface ActivityItem {
  type: "success" | "warning" | "error";
  message: string;
  detail: string;
  time: string;
  verifier: string;
}

interface ActiveCentre {
  id: string;
  centre: string;
  verifierCount: number;
  totalCandidates: number;
  verifiedCandidates: number;
  completion: number;
}

export function MonitoringContent() {
  const [stats, setStats] = useState<Stats>({
    activeVerifiers: 0,
    pendingVerifications: 0,
    completedToday: 0,
    failedToday: 0,
  });
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [centres, setCentres] = useState<ActiveCentre[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTime, setRefreshTime] = useState(new Date());

  const loadAll = useCallback(async () => {
    try {
      const [statsData, activityData, centresData] = await Promise.all([
        getMonitoringStats(),
        getRecentVerificationActivity(8),
        getActiveCentres(),
      ]);
      if (statsData) setStats(statsData);
      setActivity(activityData as ActivityItem[]);
      setCentres(centresData as ActiveCentre[]);
      setRefreshTime(new Date());
    } catch (error) {
      console.error("Error loading monitoring data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadAll, 30000);
    return () => clearInterval(interval);
  }, [loadAll]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading live data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
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
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-500">
            Last updated: {refreshTime.toLocaleTimeString()}
          </p>
          <button
            onClick={loadAll}
            className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
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
                <p className="mt-1 text-xs text-gray-500">Total registered</p>
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
        {/* Real-time Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-600" />
              Real-time Activity Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Activity className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-500 font-medium">No recent activity</p>
                <p className="text-xs text-gray-400 mt-1">
                  Verifications will appear here in real-time
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activity.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 rounded-lg border-l-4 p-3 ${
                      item.type === "success"
                        ? "border-l-green-500 bg-green-50"
                        : item.type === "warning"
                          ? "border-l-yellow-500 bg-yellow-50"
                          : "border-l-red-500 bg-red-50"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.message}</p>
                      <p className="text-sm text-gray-600">{item.detail}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span>{item.time}</span>
                        <span>•</span>
                        <span>{item.verifier}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            {centres.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MapPin className="h-10 w-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-500 font-medium">No active centres</p>
                <p className="text-xs text-gray-400 mt-1">
                  Centres with candidates will appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {centres.map((centre) => (
                  <div key={centre.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {centre.centre}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {centre.verifierCount > 0 && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {centre.verifierCount} verifier{centre.verifierCount !== 1 ? "s" : ""}
                            </span>
                          )}
                          {centre.totalCandidates > 0 && (
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {centre.verifiedCandidates}/{centre.totalCandidates} candidates
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-lg font-bold ${
                          centre.completion >= 75
                            ? "text-green-600"
                            : centre.completion >= 40
                              ? "text-yellow-600"
                              : "text-red-500"
                        }`}
                      >
                        {centre.completion}%
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className={`h-full transition-all ${
                          centre.completion >= 75
                            ? "bg-green-600"
                            : centre.completion >= 40
                              ? "bg-yellow-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${centre.completion}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
