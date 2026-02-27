"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Building2, BarChart3, Eye, Download } from "lucide-react";

export default function ManagerReportsPage() {
  const router = useRouter();
  const [centres, setCentres] = useState<any[]>([]);
  const [cityStats, setCityStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { getManagerCentres, getManagerCityStats } = await import(
          "@/app/actions/supabase-actions"
        );
        const [centresData, cityData] = await Promise.all([
          getManagerCentres(),
          getManagerCityStats(),
        ]);
        setCentres(centresData || []);
        setCityStats(cityData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const exportCSV = (data: any[], filename: string, headers: string[]) => {
    const rows = data.map((row) => headers.map((h) => row[h] ?? "").join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    link.download = filename;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
      </div>
    );
  }

  const getPct = (verified: number, total: number) =>
    total === 0 ? 0 : Math.round((verified / total) * 100);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600">Centre-wise and city-wise verification reports</p>
      </div>

      {/* Centre-wise Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-indigo-600" />
            Centre-wise Report
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              exportCSV(
                centres,
                "centre_report.csv",
                ["centre_name", "city", "totalCandidates", "verifiedCandidates", "pendingCandidates"]
              )
            }
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Centre</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Verified</TableHead>
                <TableHead className="text-center">Pending</TableHead>
                <TableHead className="text-center">%</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centres.map((c) => {
                const pct = getPct(c.verifiedCandidates, c.totalCandidates);
                return (
                  <TableRow key={c.centre_id}>
                    <TableCell>
                      <p className="font-medium">{c.centre_name}</p>
                      {c.centre_code && <p className="text-xs text-gray-400">{c.centre_code}</p>}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {c.city || "—"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{c.totalCandidates}</TableCell>
                    <TableCell className="text-center text-green-600 font-semibold">{c.verifiedCandidates}</TableCell>
                    <TableCell className="text-center text-amber-600 font-semibold">{c.pendingCandidates}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-8">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-indigo-700 border-indigo-200"
                        onClick={() =>
                          router.push(
                            `/manager/candidates?centreId=${c.centre_id}&centreName=${encodeURIComponent(c.centre_name)}` as any
                          )
                        }
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Drill Down
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* City-wise Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-600" />
            City-wise Report
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              exportCSV(
                cityStats,
                "city_report.csv",
                ["city", "totalCandidates", "verifiedCandidates", "pendingCandidates"]
              )
            }
          >
            <Download className="mr-1.5 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>City</TableHead>
                <TableHead className="text-center">Total</TableHead>
                <TableHead className="text-center">Verified</TableHead>
                <TableHead className="text-center">Pending</TableHead>
                <TableHead className="text-center">%</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cityStats.map((cs) => {
                const pct = getPct(cs.verifiedCandidates, cs.totalCandidates);
                return (
                  <TableRow key={cs.city}>
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                          {cs.city.charAt(0).toUpperCase()}
                        </div>
                        {cs.city}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{cs.totalCandidates}</TableCell>
                    <TableCell className="text-center text-green-600 font-semibold">{cs.verifiedCandidates}</TableCell>
                    <TableCell className="text-center text-amber-600 font-semibold">{cs.pendingCandidates}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className="bg-indigo-500 h-1.5 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-8">{pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-indigo-700 border-indigo-200"
                        onClick={() =>
                          router.push(
                            `/manager/candidates?city=${encodeURIComponent(cs.city)}` as any
                          )
                        }
                      >
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Drill Down
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
