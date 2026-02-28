"use client";

import { useEffect, useState } from "react";
import { Clock, ChevronDown, X } from "lucide-react";

interface Shift {
  shift_id: string;
  shift_name: string;
  shift_code: string;
  start_time: string | null;
  end_time: string | null;
}

interface ShiftFilterBarProps {
  /** Called when the selected shift changes. undefined = "All Shifts" */
  onShiftChange: (shiftId: string | undefined) => void;
  selectedShiftId?: string;
}

function fmtTime(t: string | null) {
  if (!t) return "";
  try {
    return new Date(`1970-01-01T${t}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return t;
  }
}

export function ShiftFilterBar({ onShiftChange, selectedShiftId }: ShiftFilterBarProps) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { getManagerAllShifts } = await import("@/app/actions/supabase-actions");
        const data = await getManagerAllShifts();
        setShifts(data || []);
      } catch (e) {
        console.error("Failed to load shifts:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selected = shifts.find((s) => s.shift_id === selectedShiftId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-400 w-60 animate-pulse">
        <Clock className="h-4 w-4" />
        Loading shifts...
      </div>
    );
  }

  if (shifts.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors shadow-sm ${
          selectedShiftId
            ? "border-indigo-400 bg-indigo-50 text-indigo-700"
            : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50"
        }`}
      >
        <Clock className="h-4 w-4 flex-shrink-0" />
        <span className="max-w-[180px] truncate">
          {selected ? selected.shift_name : "All Shifts"}
        </span>
        {selected ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShiftChange(undefined);
              setOpen(false);
            }}
            className="ml-1 rounded-full hover:bg-indigo-200 p-0.5"
          >
            <X className="h-3 w-3" />
          </button>
        ) : (
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[240px] rounded-lg border bg-white shadow-xl">
            <div className="p-1">
              <button
                onClick={() => {
                  onShiftChange(undefined);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  !selectedShiftId ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Clock className="h-4 w-4 text-gray-400" />
                All Shifts
              </button>
              <div className="my-1 border-t border-gray-100" />
              {shifts.map((shift) => (
                <button
                  key={shift.shift_id}
                  onClick={() => {
                    onShiftChange(shift.shift_id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    selectedShiftId === shift.shift_id
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{shift.shift_name}</span>
                    {(shift.start_time || shift.end_time) && (
                      <span className="text-xs text-gray-400">
                        {fmtTime(shift.start_time)} – {fmtTime(shift.end_time)}
                      </span>
                    )}
                  </div>
                  {shift.shift_code && (
                    <span className="ml-auto text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {shift.shift_code}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
