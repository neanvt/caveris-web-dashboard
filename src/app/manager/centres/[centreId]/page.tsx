"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Clock,
  Building2,
  Users,
  CheckCircle,
  ChevronRight,
  MapPin,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ShiftStats {
  shift_id: string;
  shift_name: string;
  shift_code: string;
  start_time: string | null;
  end_time: string | null;
  gate_open_time: string | null;
  gate_close_time: string | null;
  totalCandidates: number;
  verifiedCandidates: number;
  pendingCandidates: number;
}

interface CentreInfo {
  centre_id: string;
  centre_name: string;
  centre_code: string;
  city: string;
  address: string;
  totalCandidates: number;
  verifiedCandidates: number;
  pendingCandidates: number;
}

export default function CentreDetailPage() {
  const router = useRouter();
  const params = useParams();
  const centreId = params.centreId as string;

  const [shifts, setShifts] = useState<ShiftStats[]>([]);
  const [centreInfo, setCentreInfo] = useState<CentreInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { getManagerShiftsForCentre, getManagerCentres } = await import(
          "@/app/actions/supabase-actions"
        );
        const [shiftsData, centresData] = await Promise.all([
          getManagerShiftsForCentre(centreId),
          getManagerCentres(),
        ]);
        setShifts(shiftsData || []);
        const found = (centresData || []).find((c: any) => c.centre_id === centreId);
        if (found) setCentreInfo(found as any);
      } catch (err) {
        console.error("Error loading centre detail:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [centreId]);

  const getPct = (verified: number, total: number) =>
    total === 0 ? 0 : Math.round((verified / total) * 100);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
      </div>
    );
  }

  const barData = shifts.map((s) => ({
    name: s.shift_code || s.shift_name?.slice(0, 12) || "Shift",
    fullName: s.shift_name,
    Verified: s.verifiedCandidates,
    Pending: s.pendingCandidates,
  }));

  return (
    <div className="p-6 space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm flex-wrap">
        <button
          onClick={() => router.push("/manager/dashboard" as any)}
          className="text-indigo-600 hover:underline flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <button
          onClick={() => router.push("/manager/centres" as any)}
          className="text-indigo-600 hover:underline"
        >
          Centres
        </button>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="text-gray-700 font-medium">{centreInfo?.centre_name || "Centre"}</span>
      </div>

      {/* Centre Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-100 flex-shrink-0">
          <Building2 className="h-7 w-7 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{centreInfo?.centre_name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            {centreInfo?.centre_code && (
              <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">{centreInfo.centre_code}</span>
            )}
            {centreInfo?.city && (
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{centreInfo.city}</span>
            )}
          </div>
        </div>
      </div>

      {/* Centre Stats */}
      {centreInfo && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-2xl font-bold text-gray-900">{centreInfo.totalCandidates}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Verified</p>
              <p className="text-2xl font-bold text-green-600">{centreInfo.verifiedCandidates}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <p className="text-xs text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-amber-600">{centreInfo.pendingCandidates}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Shift-wise Bar Chart */}
      {barData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" />
              Shift-wise Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 0, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload) return null;
                    const item = barData.find((b) => b.name === label);
                    return (
                      <div className="rounded-lg border bg-white p-3 shadow text-xs">
                        <p className="font-semibold mb-1">{item?.fullName || label}</p>
                        {payload.map((p: any) => (
                          <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
                        ))}
                      </div>
                    );
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Verified" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Pending" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Shifts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4 text-indigo-600" />
            Shifts — Click to view candidates
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {shifts.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-3 text-gray-600">No shifts found for this centre.</p>
              <p className="text-sm text-gray-500 mt-1">
                You can still{" "}
                <button
                  className="text-indigo-600 underline"
                  onClick={() =>
                    router.push(
                      `/manager/candidates?centreId=${centreId}&centreName=${encodeURIComponent(centreInfo?.centre_name || "")}` as any
                    )
                  }
                >
                  view all candidates
                </button>{" "}
                for this centre.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {shifts.map((shift) => {
                const pct = getPct(shift.verifiedCandidates, shift.totalCandidates);
                return (
                  <button
                    key={shift.shift_id}
                    onClick={() =>
                      router.push(
                        `/manager/candidates?centreId=${centreId}&shiftId=${shift.shift_id}&shiftName=${encodeURIComponent(shift.shift_name)}&centreName=${encodeURIComponent(centreInfo?.centre_name || "")}` as any
                      )
                    }
                    className="w-full flex items-center gap-4 px-6 py-4 hover:bg-indigo-50 transition-colors text-left"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 flex-shrink-0">
                      <Clock className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{shift.shift_name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5 flex-wrap">
                        {shift.shift_code && (
                          <span className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">{shift.shift_code}</span>
                        )}
                        {shift.start_time && (
                          <span>Start: {shift.start_time}</span>
                        )}
                        {shift.end_time && (
                          <span>End: {shift.end_time}</span>
                        )}
                        {shift.gate_open_time && (
                          <span>Gate Open: {shift.gate_open_time}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-lg font-bold text-gray-900">{shift.totalCandidates}</p>
                        <p className="text-xs text-gray-400">Total</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-lg font-bold text-green-600">{shift.verifiedCandidates}</p>
                        <p className="text-xs text-gray-400">Verified</p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-lg font-bold text-amber-600">{shift.pendingCandidates}</p>
                        <p className="text-xs text-gray-400">Pending</p>
                      </div>
                      <div className="w-20">
                        <p className="text-xs text-gray-500 mb-1">{pct}%</p>
                        <div className="bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-indigo-500 h-2 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
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
