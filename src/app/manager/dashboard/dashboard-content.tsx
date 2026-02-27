"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  CheckCircle,
  Clock,
  MapPin,
  TrendingUp,
  ChevronRight,
  Eye,
} from "lucide-react";

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
  address: string;
  exams: { exam_id: string; exam_name: string; exam_code: string }[];
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

export function ManagerDashboardContent() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [centres, setCentres] = useState<CentreStats[]>([]);
  const [cityStats, setCityStats] = useState<CityStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const { getManagerDashboardStats, getManagerCentres, getManagerCityStats } =
        await import("@/app/actions/supabase-actions");

      const [statsData, centresData, cityData] = await Promise.all([
        getManagerDashboardStats(),
        getManagerCentres(),
        getManagerCityStats(),
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

  const getVerificationPercent = (verified: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((verified / total) * 100);
  };

  const getStatusColor = (percent: number) => {
    if (percent >= 90) return "text-green-600";
    if (percent >= 60) return "text-yellow-600";
    return "text-red-600";
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
        <p className="text-gray-600">Overview of your assigned centres and candidate verifications</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assigned Centres</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats?.totalCentres ?? 0}</p>
                <p className="mt-1 text-xs text-gray-500">centres under your management</p>
              </div>
              <div className="rounded-full bg-indigo-100 p-3">
                <Building2 className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Candidates</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {(stats?.totalCandidates ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 flex items-center text-xs text-indigo-600">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Across all centres
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Verified</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {(stats?.verifiedCandidates ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {getVerificationPercent(stats?.verifiedCandidates ?? 0, stats?.totalCandidates ?? 0)}% completion rate
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">
                  {(stats?.pendingCandidates ?? 0).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-gray-500">awaiting verification</p>
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <Clock className="h-8 w-8 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Centre-wise Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Centre-wise Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {centres.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">No centres assigned yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Centre</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Exams</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  <TableHead className="text-center">Verified</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centres.map((centre) => {
                  const pct = getVerificationPercent(centre.verifiedCandidates, centre.totalCandidates);
                  return (
                    <TableRow key={centre.centre_id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{centre.centre_name}</p>
                          {centre.centre_code && (
                            <p className="text-xs text-gray-500">{centre.centre_code}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-gray-600">
                          <MapPin className="h-3 w-3" />
                          {centre.city || "—"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {centre.exams.slice(0, 2).map((exam) => (
                            <Badge key={exam.exam_id} variant="outline" className="text-xs">
                              {exam.exam_code || exam.exam_name}
                            </Badge>
                          ))}
                          {centre.exams.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{centre.exams.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {centre.totalCandidates}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-green-600">{centre.verifiedCandidates}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-amber-600">{centre.pendingCandidates}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${getStatusColor(pct)}`}>
                            {pct}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                          onClick={() =>
                            router.push(
                              `/manager/candidates?centreId=${centre.centre_id}&centreName=${encodeURIComponent(centre.centre_name)}` as any
                            )
                          }
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View Candidates
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* City-wise Report */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            City-wise Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {cityStats.length === 0 ? (
            <div className="py-12 text-center">
              <MapPin className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600">No city data available</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>City</TableHead>
                  <TableHead className="text-center">Total Candidates</TableHead>
                  <TableHead className="text-center">Verified</TableHead>
                  <TableHead className="text-center">Pending</TableHead>
                  <TableHead className="text-center">Progress</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cityStats.map((city) => {
                  const pct = getVerificationPercent(city.verifiedCandidates, city.totalCandidates);
                  return (
                    <TableRow key={city.city}>
                      <TableCell>
                        <div className="flex items-center gap-2 font-medium text-gray-900">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                            {city.city.charAt(0).toUpperCase()}
                          </div>
                          {city.city}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {city.totalCandidates}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-green-600">{city.verifiedCandidates}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold text-amber-600">{city.pendingCandidates}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${getStatusColor(pct)}`}>
                            {pct}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                          onClick={() =>
                            router.push(
                              `/manager/candidates?city=${encodeURIComponent(city.city)}` as any
                            )
                          }
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          View by City
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
