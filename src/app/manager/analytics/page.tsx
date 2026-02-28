"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  BarChart2,
  Building2,
  MapPin,
  Clock,
  ChevronRight,
  Home,
  TrendingUp,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────
type ViewState =
  | { kind: "overview" }
  | { kind: "centre-shifts"; centreId: string; centreName: string }
  | { kind: "city-centres"; city: string }
  | { kind: "city-centre-shifts"; city: string; centreId: string; centreName: string }
  | { kind: "shift-centres"; shiftId: string; shiftName: string };

interface StatRow {
  id: string;
  name: string;
  code?: string;
  totalCandidates: number;
  verifiedCandidates: number;
  pendingCandidates: number;
}

const VER_COLOR = "#22c55e";
const PEN_COLOR = "#f59e0b";
const PIE_COLORS = [VER_COLOR, PEN_COLOR];

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function toBarItem(row: StatRow) {
  return {
    id: row.id,
    name: row.code || row.name.slice(0, 14),
    fullName: row.name,
    Verified: row.verifiedCandidates,
    Pending: row.pendingCandidates,
    Total: row.totalCandidates,
  };
}

function pct(v: number, t: number) {
  return t === 0 ? 0 : Math.round((v / t) * 100);
}

// ──────────────────────────────────────────────────────────────
// Custom Tooltip
// ──────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, barData }: any) {
  if (!active || !payload || !payload.length) return null;
  const item = barData?.find((b: any) => b.name === label);
  return (
    <div className="rounded-lg border bg-white p-3 shadow-lg text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-gray-900">{item?.fullName || label}</p>
      <p className="text-gray-500">Total: <span className="font-medium text-gray-900">{item?.Total || 0}</span></p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill }}>
          {p.name}: <span className="font-medium">{p.value}</span>{" "}
          <span className="text-gray-400">({item ? pct(p.value, item.Total) : 0}%)</span>
        </p>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Drill-down chart section
// ──────────────────────────────────────────────────────────────
function DrillChart({
  title,
  icon,
  data,
  onBarClick,
  clickHint,
  color = "indigo",
}: {
  title: string;
  icon: React.ReactNode;
  data: ReturnType<typeof toBarItem>[];
  onBarClick?: (item: ReturnType<typeof toBarItem>) => void;
  clickHint?: string;
  color?: string;
}) {
  const interactive = !!onBarClick;
  return (
    <Card className={interactive ? "cursor-pointer hover:shadow-md transition-shadow" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
          {clickHint && (
            <span className="ml-auto text-xs font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
              {clickHint}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">No data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 16, left: -10, bottom: 0 }}
              onClick={(e: any) => {
                if (!interactive || !e?.activePayload?.[0]) return;
                const clickedName = e.activeLabel;
                const found = data.find((d) => d.name === clickedName);
                if (found) onBarClick(found);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={(props) => <CustomTooltip {...props} barData={data} />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar
                dataKey="Verified"
                fill={VER_COLOR}
                radius={[4, 4, 0, 0]}
                style={interactive ? { cursor: "pointer" } : {}}
              />
              <Bar
                dataKey="Pending"
                fill={PEN_COLOR}
                radius={[4, 4, 0, 0]}
                style={interactive ? { cursor: "pointer" } : {}}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────
// Breadcrumb
// ──────────────────────────────────────────────────────────────
function Breadcrumb({ view, setView }: { view: ViewState; setView: (v: ViewState) => void }) {
  const crumbs: { label: string; onClick?: () => void }[] = [
    { label: "Overview", onClick: () => setView({ kind: "overview" }) },
  ];

  if (view.kind === "centre-shifts") {
    crumbs.push({ label: view.centreName });
  } else if (view.kind === "city-centres") {
    crumbs.push({ label: view.city });
  } else if (view.kind === "city-centre-shifts") {
    crumbs.push({
      label: view.city,
      onClick: () => setView({ kind: "city-centres", city: view.city }),
    });
    crumbs.push({ label: view.centreName });
  } else if (view.kind === "shift-centres") {
    crumbs.push({ label: view.shiftName });
  }

  return (
    <div className="flex items-center gap-1.5 text-sm flex-wrap">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
          {c.onClick ? (
            <button onClick={c.onClick} className="text-indigo-600 hover:underline">
              {c.label}
            </button>
          ) : (
            <span className="text-gray-700 font-medium">{c.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main Analytics Page
// ──────────────────────────────────────────────────────────────
export default function ManagerAnalyticsPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewState>({ kind: "overview" });

  // All top-level data
  const [centres, setCentres] = useState<StatRow[]>([]);
  const [cityStats, setCityStats] = useState<StatRow[]>([]);
  const [allShifts, setAllShifts] = useState<(StatRow & { shiftId: string })[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);

  // Drill-down data
  const [drillData, setDrillData] = useState<StatRow[]>([]);
  const [loadingDrill, setLoadingDrill] = useState(false);

  // Load overview
  useEffect(() => {
    const load = async () => {
      try {
        const { getManagerCentres, getManagerCityStats, getManagerAllShiftsStats } =
          await import("@/app/actions/supabase-actions");
        const [centresData, cityData, shiftsData] = await Promise.all([
          getManagerCentres(),
          getManagerCityStats(),
          getManagerAllShiftsStats(),
        ]);
        setCentres(
          (centresData || []).map((c: any) => ({
            id: c.centre_id,
            name: c.centre_name,
            code: c.centre_code,
            totalCandidates: c.totalCandidates,
            verifiedCandidates: c.verifiedCandidates,
            pendingCandidates: c.pendingCandidates,
          }))
        );
        setCityStats(
          (cityData || []).map((c: any) => ({
            id: c.city,
            name: c.city,
            totalCandidates: c.totalCandidates,
            verifiedCandidates: c.verifiedCandidates,
            pendingCandidates: c.pendingCandidates,
          }))
        );
        setAllShifts(
          (shiftsData || []).map((s: any) => ({
            id: s.shift_id,
            shiftId: s.shift_id,
            name: s.shift_name,
            code: s.shift_code,
            totalCandidates: s.totalCandidates,
            verifiedCandidates: s.verifiedCandidates,
            pendingCandidates: s.pendingCandidates,
          }))
        );
      } catch (e) {
        console.error("Analytics overview load error:", e);
      } finally {
        setLoadingOverview(false);
      }
    };
    load();
  }, []);

  // Load drill-down data when view changes
  const loadDrill = useCallback(async (v: ViewState) => {
    if (v.kind === "overview") return;
    setLoadingDrill(true);
    try {
      if (v.kind === "centre-shifts" || v.kind === "city-centre-shifts") {
        const { getManagerShiftsForCentre } = await import("@/app/actions/supabase-actions");
        const data = await getManagerShiftsForCentre(v.centreId);
        setDrillData(
          (data || []).map((s: any) => ({
            id: s.shift_id,
            name: s.shift_name,
            code: s.shift_code,
            totalCandidates: s.totalCandidates,
            verifiedCandidates: s.verifiedCandidates,
            pendingCandidates: s.pendingCandidates,
          }))
        );
      } else if (v.kind === "city-centres") {
        const { getManagerCentresByCity } = await import("@/app/actions/supabase-actions");
        const data = await getManagerCentresByCity(v.city);
        setDrillData(
          (data || []).map((c: any) => ({
            id: c.centre_id,
            name: c.centre_name,
            code: c.centre_code,
            totalCandidates: c.totalCandidates,
            verifiedCandidates: c.verifiedCandidates,
            pendingCandidates: c.pendingCandidates,
          }))
        );
      } else if (v.kind === "shift-centres") {
        const { getManagerCentresForShift } = await import("@/app/actions/supabase-actions");
        const data = await getManagerCentresForShift(v.shiftId);
        setDrillData(
          (data || []).map((c: any) => ({
            id: c.centre_id,
            name: c.centre_name,
            code: c.centre_code,
            totalCandidates: c.totalCandidates,
            verifiedCandidates: c.verifiedCandidates,
            pendingCandidates: c.pendingCandidates,
          }))
        );
      }
    } catch (e) {
      console.error("Drill-down load error:", e);
    } finally {
      setLoadingDrill(false);
    }
  }, []);

  useEffect(() => {
    loadDrill(view);
  }, [view, loadDrill]);

  // Total summary
  const totalV = centres.reduce((s, c) => s + c.verifiedCandidates, 0);
  const totalP = centres.reduce((s, c) => s + c.pendingCandidates, 0);
  const total = totalV + totalP;
  const pieData = [{ name: "Verified", value: totalV }, { name: "Pending", value: totalP }];

  if (loadingOverview) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // Prepare bar items
  const centreBar = centres.map(toBarItem);
  const cityBar = cityStats.map(toBarItem);
  const shiftBar = allShifts.map(toBarItem);
  const drillBar = drillData.map(toBarItem);

  return (
    <div className="p-6 space-y-5">
      {/* Top nav */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => router.push("/manager/dashboard" as any)}
          className="flex items-center gap-1 text-indigo-600 hover:underline text-sm"
        >
          <Home className="h-4 w-4" /> Dashboard
        </button>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <button
          onClick={() => setView({ kind: "overview" })}
          className="text-indigo-600 hover:underline text-sm"
        >
          Analytics
        </button>
        {view.kind !== "overview" && (
          <>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <Breadcrumb view={view} setView={setView} />
          </>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Verification Analytics</h1>
        <p className="text-gray-600 text-sm">
          {view.kind === "overview"
            ? "Click any chart bar to drill deeper into the data"
            : "Click the bars or breadcrumbs to navigate"}
        </p>
      </div>

      {/* ── OVERVIEW ── */}
      {view.kind === "overview" && (
        <>
          {/* Overall donut + summary row */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-600" />
                  Overall Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip formatter={(val: any) => val.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-xl font-bold text-indigo-700">{pct(totalV, total)}%</p>
                    <p className="text-xs text-gray-500">Done</p>
                  </div>
                </div>
                <div className="flex justify-center gap-4 text-xs mt-1">
                  <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" />Verified: {totalV}</div>
                  <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" />Pending: {totalP}</div>
                </div>
              </CardContent>
            </Card>

            <div className="md:col-span-3 grid grid-cols-3 gap-3">
              {[
                { label: "Total", val: total, cls: "border-blue-500 text-gray-900" },
                { label: "Verified", val: totalV, cls: "border-green-500 text-green-600" },
                { label: "Pending", val: totalP, cls: "border-amber-500 text-amber-600" },
              ].map((s) => (
                <Card key={s.label} className={`border-l-4 ${s.cls}`}>
                  <CardContent className="p-5">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${s.cls.split(" ")[1]}`}>{s.val.toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Centre-wise chart — click bar → centre-shifts */}
          <DrillChart
            title="Centre-wise Breakdown"
            icon={<Building2 className="h-4 w-4 text-indigo-600" />}
            data={centreBar}
            clickHint="Click bar → Shift breakdown"
            onBarClick={(item) =>
              setView({ kind: "centre-shifts", centreId: item.id, centreName: item.fullName })
            }
          />

          {/* City-wise chart — click bar → city-centres */}
          <DrillChart
            title="City-wise Breakdown"
            icon={<MapPin className="h-4 w-4 text-indigo-600" />}
            data={cityBar}
            clickHint="Click bar → Centres in city"
            onBarClick={(item) => setView({ kind: "city-centres", city: item.name })}
          />

          {/* Shift-wise chart — click bar → shift-centres */}
          {shiftBar.length > 0 && (
            <DrillChart
              title="Shift-wise Overview (All Centres)"
              icon={<Clock className="h-4 w-4 text-indigo-600" />}
              data={shiftBar}
              clickHint="Click bar → Centres for this shift"
              onBarClick={(item) =>
                setView({ kind: "shift-centres", shiftId: item.id, shiftName: item.fullName })
              }
            />
          )}
        </>
      )}

      {/* ── DRILL: Centre → Shifts ── */}
      {(view.kind === "centre-shifts" || view.kind === "city-centre-shifts") && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            onClick={() =>
              view.kind === "city-centre-shifts"
                ? setView({ kind: "city-centres", city: view.city })
                : setView({ kind: "overview" })
            }
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            {view.kind === "city-centre-shifts" ? `Back to ${view.city}` : "Back to Overview"}
          </Button>

          {loadingDrill ? (
            <div className="py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
            </div>
          ) : (
            <DrillChart
              title={`Shift-wise — ${view.centreName}`}
              icon={<Clock className="h-4 w-4 text-indigo-600" />}
              data={drillBar}
              onBarClick={(item) =>
                router.push(
                  `/manager/candidates?centreId=${view.centreId}&shiftId=${item.id}&shiftName=${encodeURIComponent(item.fullName)}&centreName=${encodeURIComponent(view.centreName)}` as any
                )
              }
              clickHint="Click bar → View candidates"
            />
          )}
        </>
      )}

      {/* ── DRILL: City → Centres ── */}
      {view.kind === "city-centres" && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            onClick={() => setView({ kind: "overview" })}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Overview
          </Button>

          {loadingDrill ? (
            <div className="py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
            </div>
          ) : (
            <DrillChart
              title={`Centres in ${view.city}`}
              icon={<Building2 className="h-4 w-4 text-indigo-600" />}
              data={drillBar}
              onBarClick={(item) =>
                setView({
                  kind: "city-centre-shifts",
                  city: view.city,
                  centreId: item.id,
                  centreName: item.fullName,
                })
              }
              clickHint="Click bar → Shift breakdown"
            />
          )}
        </>
      )}

      {/* ── DRILL: Shift → Centres ── */}
      {view.kind === "shift-centres" && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            onClick={() => setView({ kind: "overview" })}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Overview
          </Button>

          {loadingDrill ? (
            <div className="py-12 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto" />
            </div>
          ) : (
            <DrillChart
              title={`Centres running "${view.shiftName}"`}
              icon={<Building2 className="h-4 w-4 text-indigo-600" />}
              data={drillBar}
              onBarClick={(item) =>
                router.push(
                  `/manager/candidates?centreId=${item.id}&shiftId=${view.shiftId}&shiftName=${encodeURIComponent(view.shiftName)}&centreName=${encodeURIComponent(item.fullName)}` as any
                )
              }
              clickHint="Click bar → View candidates"
            />
          )}
        </>
      )}
    </div>
  );
}
