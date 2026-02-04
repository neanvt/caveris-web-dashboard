"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar } from "lucide-react";
import { format } from "date-fns";

interface Shift {
  id: string;
  shift_name: string;
  shift_code: string;
  gate_open_time: string;
  gate_close_time: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ViewShiftModalProps {
  shift: Shift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewShiftModal({
  shift,
  open,
  onOpenChange,
}: ViewShiftModalProps) {
  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>Shift Details</DialogTitle>
              <DialogDescription>View shift information</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm text-orange-600 font-medium mb-1">
                Shift Name
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {shift.shift_name}
              </p>
            </div>

            <div>
              <p className="text-sm text-orange-600 font-medium mb-1">
                Shift Code
              </p>
              <code className="px-2 py-1 bg-white border border-orange-300 rounded text-sm font-mono">
                {shift.shift_code}
              </code>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium mb-1">
                Gate Open Time
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {formatTime(shift.gate_open_time || "")}
              </p>
            </div>

            <div className="bg-gray-50 border rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium mb-1">
                Gate Close Time
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {formatTime(shift.gate_close_time || "")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 border rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium mb-1">
                Start Time
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {formatTime(shift.start_time)}
              </p>
            </div>

            <div className="bg-gray-50 border rounded-lg p-4">
              <p className="text-sm text-gray-600 font-medium mb-1">End Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatTime(shift.end_time)}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border rounded-lg p-4">
            <p className="text-sm text-gray-600 font-medium mb-2">Status</p>
            <Badge
              variant={shift.is_active ? "default" : "secondary"}
              className={
                shift.is_active
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : ""
              }
            >
              {shift.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="border-t pt-4 space-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Created: {format(new Date(shift.created_at), "PPp")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Updated: {format(new Date(shift.updated_at), "PPp")}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
