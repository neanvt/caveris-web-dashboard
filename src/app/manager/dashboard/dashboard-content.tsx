"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShiftFilterBar } from "@/components/manager/shift-filter-bar";
import {
  Building2,
  Users,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalCentres: number;
  totalCandidates: number;
  verifiedCandidates: number;
  pendingCandidates: number;
}

interface CentreStats {
  centre_id: string;
  centre_name: string;
  centre_code: string;
  city: string;
  totalCandidates: number;
  verifiedCandidates: number;
  pendingCandidates: number;
}

interface CityStats {
  city: string;
  totalCandidates: number;
  verifiedCandidates: number;
  pendingCandidates: number;
}

const CHART_COLORS = {
  verified: "#22c55e",
  pending: "#f59e0b",
  absent: "#ef4444",
  indigo: "#6366f1",
};

const PIE_COLORS = ["#22c55e", "#f59e0b", "#ef4444"];

export function ManagerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlShiftId = searchParams.get("shiftId") || undefined;
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [centres, setCentres] = useState<CentreStats[]>([]);
  const [cityStats, setCityStats] = useState<CityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShiftId, setSelectedShiftId] = useState<string | undefined>(urlShiftId);

  // Utility: build a URL with current shiftId appended if set
  const buildUrl = (base: string, extraParams?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (selectedShiftId) params.set("shiftId", selectedShiftId);
    if (extraParams) Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  useEffect(() => {
    loadAll(selectedShiftId);
  }, [selectedShiftId]);

  const loadAll = async (shiftId?: string) => {
    setLoading(true);
    try {
      const { getManagerDashboardStats, getManagerCentres, getManagerCityStats } =
        await import("@/app/actions/supabase-actions");
      const [statsData, centresData, cityData] = await Promise.all([
        getManagerDashboardStats(shiftId),
        getManagerCentres(shiftId),
        getManagerCityStats(shiftId),
      ]);
      if (statsData) setStats(statsData);
      setCentres(centresData || []);
      setCityStats(cityData || []);
    } catch (err) {
      console.error("Error loading manager dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const getVerificationPercent = (verified: number, total: number) =>
    total === 0 ? 0 : Math.round((verified / total) * 100);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Chart data
  const pieData = [
    { name: "Verified", value: stats?.verifiedCandidates || 0 },
    { name: "Pending", value: stats?.pendingCandidates || 0 },
  ];

  const centreBarData = centres.slice(0, 8).map((c) => ({
    name: c.centre_code || c.centre_name.slice(0, 12),
    fullName: c.centre_name,
    Verified: c.verifiedCandidates,
    Pending: c.pendingCandidates,
    Total: c.totalCandidates,
  }));

  const cityBarData = cityStats.slice(0, 8).map((c) => ({
    name: c.city,
    Verified: c.verifiedCandidates,
    Pending: c.pendingCandidates,
  }));


  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-600 text-sm">Click any card to drill down into details</p>
        </div>
        <ShiftFilterBar
          selectedShiftId={selectedShiftId}
          onShiftChange={(id) => setSelectedShiftId(id)}
        />
      </div>

      {/* Clickable Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Assigned Centres */}
        <button
          onClick={() => router.push(buildUrl("/manager/centres"))}
          className="group text-left"
        >
          <Card className="border-l-4 border-l-indigo-500 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Assigned Centres</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalCentres ?? 0}</p>
                  <p className="mt-1 text-xs text-indigo-600 flex items-center gap-1 group-hover:underline">
                    View all centres <ChevronRight className="h-3 w-3" />
                  </p>
                </div>
                <div className="rounded-full bg-indigo-100 p-3">
                  <Building2 className="h-8 w-8 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        {/* Total Candidates */}
        <button
          onClick={() => router.push(buildUrl("/manager/candidates"))}
          className="group text-left"
        >
          <Card className="border-l-4 border-l-blue-500 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">
                    {(stats?.totalCandidates ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-blue-600 flex items-center gap-1 group-hover:underline">
                    View all candidates <ChevronRight className="h-3 w-3" />
                  </p>
                </div>
                <div className="rounded-full bg-blue-100 p-3">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        {/* Verified */}
        <button
          onClick={() => router.push(buildUrl("/manager/candidates", { status: "verified" }))}  
          className="group text-left"
        >
          <Card className="border-l-4 border-l-green-500 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="mt-2 text-3xl font-bold text-green-600">
                    {(stats?.verifiedCandidates ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1 group-hover:underline">
                    {getVerificationPercent(stats?.verifiedCandidates ?? 0, stats?.totalCandidates ?? 0)}% completion <ChevronRight className="h-3 w-3" />
                  </p>
                </div>
                <div className="rounded-full bg-green-100 p-3">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>

        {/* Pending */}
        <button
          onClick={() => router.push(buildUrl("/manager/candidates", { status: "pending" }))}  
          className="group text-left"
        >
          <Card className="border-l-4 border-l-amber-500 cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600">
                    {(stats?.pendingCandidates ?? 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-amber-600 flex items-center gap-1 group-hover:underline">
                    View pending <ChevronRight className="h-3 w-3" />
                  </p>
                </div>
                <div className="rounded-full bg-amber-100 p-3">
                  <Clock className="h-8 w-8 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Donut — Verified vs Pending — CLICKABLE → Analytics */}
        <button
          onClick={() => router.push(buildUrl("/manager/analytics"))}  
          className="group text-left"
        >
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5 h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                Verification Status
                <span className="ml-auto text-xs font-normal text-indigo-500 group-hover:underline flex items-center gap-0.5">
                  Drill down <ChevronRight className="h-3 w-3" />
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => (val ?? 0).toLocaleString()} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-2xl font-bold text-indigo-700">
                    {getVerificationPercent(stats?.verifiedCandidates || 0, stats?.totalCandidates || 0)}%
                  </p>
                  <p className="text-xs text-gray-500">Done</p>
                </div>
              </div>
              <div className="mt-2 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-green-500 inline-block" />Verified</div>
                <div className="flex items-center gap-1"><span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />Pending</div>
              </div>
              <p className="text-center text-xs text-indigo-500 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                Click to see centre / city / shift breakdown →
              </p>
            </CardContent>
          </Card>
        </button>

        {/* Bar — Centre-wise */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-600" />
              Centre-wise Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={centreBarData} margin={{ top: 0, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload) return null;
                    const item = centreBarData.find((c) => c.name === label);
                    return (
                      <div className="rounded-lg border bg-white p-3 shadow text-xs">
                        <p className="font-semibold text-gray-900 mb-1">{item?.fullName || label}</p>
                        {payload.map((p: any) => (
                          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Verified" fill={CHART_COLORS.verified} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill={CHART_COLORS.pending} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* City-wise Bar Chart */}
      {cityBarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-indigo-600" />
              City-wise Verification Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cityBarData} margin={{ top: 0, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Verified" fill={CHART_COLORS.verified} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill={CHART_COLORS.pending} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Centres Quick List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-indigo-600" />
            Centres — Click to view shifts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {centres.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No centres assigned</div>
          ) : (
            <div className="divide-y">
              {centres.map((centre) => {
                const pct = getVerificationPercent(centre.verifiedCandidates, centre.totalCandidates);
                return (
                  <button
                    key={centre.centre_id}
                    onClick={() => router.push(buildUrl(`/manager/centres/${centre.centre_id}`))}
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 flex-shrink-0">
                      <Building2 className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{centre.centre_name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <MapPin className="h-3 w-3" />{centre.city}
                        {centre.centre_code && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{centre.centre_code}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-lg font-bold text-gray-900">{centre.totalCandidates}</p>
                        <p className="text-xs text-gray-400">Total</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-lg font-bold text-green-600">{centre.verifiedCandidates}</p>
                        <p className="text-xs text-gray-400">Verified</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-lg font-bold text-amber-600">{centre.pendingCandidates}</p>
                        <p className="text-xs text-gray-400">Pending</p>
                      </div>
                      <div className="w-20">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{pct}%</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2">
                          <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* City-wise Quick List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4 text-indigo-600" />
            Cities — Click to view candidates by city
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {cityStats.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No city data</div>
          ) : (
            <div className="divide-y">
              {cityStats.map((city) => {
                const pct = getVerificationPercent(city.verifiedCandidates, city.totalCandidates);
                return (
                  <button
                    key={city.city}
                    onClick={() =>
                      router.push(buildUrl("/manager/candidates", { city: city.city }))
                    }
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 flex-shrink-0">
                      <span className="text-sm font-bold text-amber-700">{city.city.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{city.city}</p>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-lg font-bold text-gray-900">{city.totalCandidates}</p>
                        <p className="text-xs text-gray-400">Total</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-lg font-bold text-green-600">{city.verifiedCandidates}</p>
                        <p className="text-xs text-gray-400">Verified</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-lg font-bold text-amber-600">{city.pendingCandidates}</p>
                        <p className="text-xs text-gray-400">Pending</p>
                      </div>
                      <div className="w-20">
                        <p className="text-xs text-gray-500 mb-1">{pct}%</p>
                        <div className="bg-gray-100 rounded-full h-2">
                          <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
