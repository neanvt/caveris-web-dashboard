"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  MapPin,
  Eye,
  Clock,
} from "lucide-react";

export default function ManagerCentresPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Carry forward shift filter from dashboard drilldown
  const shiftId = searchParams.get("shiftId") || undefined;

  const [centres, setCentres] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { getManagerCentres } = await import("@/app/actions/supabase-actions");
        const data = await getManagerCentres(shiftId);
        setCentres(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [shiftId]);

  // Build navigation URL carrying the shiftId forward
  const buildUrl = (base: string, extraParams?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (shiftId) params.set("shiftId", shiftId);
    if (extraParams) Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Centres</h1>
          <p className="text-gray-600">All exam centres assigned to you</p>
        </div>
        {/* Show active shift filter badge if inherited from dashboard */}
        {shiftId && (
          <div className="flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-1.5 text-sm text-indigo-700 font-medium">
            <Clock className="h-3.5 w-3.5" />
            Shift filter active — showing filtered data
          </div>
        )}
      </div>

      {centres.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">
              {shiftId ? "No centres assigned for this shift" : "No centres assigned yet"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {centres.map((centre) => {
            const pct =
              centre.totalCandidates > 0
                ? Math.round((centre.verifiedCandidates / centre.totalCandidates) * 100)
                : 0;
            return (
              <Card key={centre.centre_id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start justify-between text-base">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 flex-shrink-0">
                        <Building2 className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{centre.centre_name}</p>
                        {centre.centre_code && (
                          <p className="text-xs text-gray-500">{centre.centre_code}</p>
                        )}
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="h-3.5 w-3.5" />
                    {centre.city || "—"}
                  </div>

                  {centre.exams && centre.exams.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {centre.exams.map((exam: any) => (
                        <Badge key={exam.exam_id} variant="outline" className="text-xs">
                          {exam.exam_code || exam.exam_name}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-gray-50 p-2">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="font-bold text-gray-900">{centre.totalCandidates}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2">
                      <p className="text-xs text-green-600">Verified</p>
                      <p className="font-bold text-green-700">{centre.verifiedCandidates}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2">
                      <p className="text-xs text-amber-600">Pending</p>
                      <p className="font-bold text-amber-700">{centre.pendingCandidates}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() =>
                      router.push(buildUrl(`/manager/centres/${centre.centre_id}`) as any)
                    }
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Select Shift &amp; View Candidates
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
