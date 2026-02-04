"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Clock } from "lucide-react";

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

interface EditShiftModalProps {
  shift: Shift;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditShiftModal({
  shift,
  open,
  onOpenChange,
  onSuccess,
}: EditShiftModalProps) {
  const [formData, setFormData] = useState({
    shift_name: "",
    gate_open_time: "",
    gate_close_time: "",
    start_time: "",
    end_time: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    if (shift) {
      setFormData({
        shift_name: shift.shift_name,
        gate_open_time: shift.gate_open_time || "",
        gate_close_time: shift.gate_close_time || "",
        start_time: shift.start_time,
        end_time: shift.end_time,
        is_active: shift.is_active,
      });
    }
  }, [shift]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.shift_name.trim()) {
      newErrors.shift_name = "Shift name is required";
    }

    if (!formData.gate_open_time) {
      newErrors.gate_open_time = "Gate open time is required";
    }

    if (!formData.gate_close_time) {
      newErrors.gate_close_time = "Gate close time is required";
    }

    if (!formData.start_time) {
      newErrors.start_time = "Start time is required";
    }

    if (!formData.end_time) {
      newErrors.end_time = "End time is required";
    }

    // Validate time sequence: gate_open < gate_close <= start < end
    if (formData.gate_open_time && formData.gate_close_time) {
      const [gateOpenHours, gateOpenMinutes] = formData.gate_open_time
        .split(":")
        .map(Number);
      const [gateCloseHours, gateCloseMinutes] = formData.gate_close_time
        .split(":")
        .map(Number);
      const gateOpenMinutesTotal = gateOpenHours * 60 + gateOpenMinutes;
      const gateCloseMinutesTotal = gateCloseHours * 60 + gateCloseMinutes;

      if (gateCloseMinutesTotal <= gateOpenMinutesTotal) {
        newErrors.gate_close_time =
          "Gate close time must be after gate open time";
      }
    }

    if (formData.gate_close_time && formData.start_time) {
      const [gateCloseHours, gateCloseMinutes] = formData.gate_close_time
        .split(":")
        .map(Number);
      const [startHours, startMinutes] = formData.start_time
        .split(":")
        .map(Number);
      const gateCloseMinutesTotal = gateCloseHours * 60 + gateCloseMinutes;
      const startTotalMinutes = startHours * 60 + startMinutes;

      if (startTotalMinutes < gateCloseMinutesTotal) {
        newErrors.start_time = "Start time must be after gate close time";
      }
    }

    if (formData.start_time && formData.end_time) {
      const [startHours, startMinutes] = formData.start_time
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = formData.end_time.split(":").map(Number);
      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;

      if (endTotalMinutes <= startTotalMinutes) {
        newErrors.end_time = "End time must be after start time";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const { updateShift } = await import("@/app/actions/supabase-actions");
      const result = await updateShift(shift.id, {
        shift_name: formData.shift_name.trim(),
        gate_open_time: formData.gate_open_time,
        gate_close_time: formData.gate_close_time,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_active: formData.is_active,
      });

      if (result.error) throw new Error(result.error);

      toast.success("Shift updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to update shift";
      toast.error(message);
    } finally {
      setLoading(false);
    }
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
              <DialogTitle>Edit Shift</DialogTitle>
              <DialogDescription>Update shift information</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shift_name">
              Shift Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="shift_name"
              placeholder="e.g., Morning Shift"
              value={formData.shift_name}
              onChange={(e) =>
                setFormData({ ...formData, shift_name: e.target.value })
              }
              className={errors.shift_name ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.shift_name && (
              <p className="text-sm text-red-500">{errors.shift_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="shift_code">Shift Code</Label>
            <Input
              id="shift_code"
              value={shift.shift_code}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">
              Shift code cannot be changed
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gate_open_time">
                Gate Open Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="gate_open_time"
                type="time"
                value={formData.gate_open_time}
                onChange={(e) =>
                  setFormData({ ...formData, gate_open_time: e.target.value })
                }
                className={errors.gate_open_time ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.gate_open_time && (
                <p className="text-sm text-red-500">{errors.gate_open_time}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gate_close_time">
                Gate Close Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="gate_close_time"
                type="time"
                value={formData.gate_close_time}
                onChange={(e) =>
                  setFormData({ ...formData, gate_close_time: e.target.value })
                }
                className={errors.gate_close_time ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.gate_close_time && (
                <p className="text-sm text-red-500">{errors.gate_close_time}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">
                Start Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) =>
                  setFormData({ ...formData, start_time: e.target.value })
                }
                className={errors.start_time ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.start_time && (
                <p className="text-sm text-red-500">{errors.start_time}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_time">
                End Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) =>
                  setFormData({ ...formData, end_time: e.target.value })
                }
                className={errors.end_time ? "border-red-500" : ""}
                disabled={loading}
              />
              {errors.end_time && (
                <p className="text-sm text-red-500">{errors.end_time}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_active">Status</Label>
            <Select
              value={formData.is_active ? "active" : "inactive"}
              onValueChange={(value) =>
                setFormData({ ...formData, is_active: value === "active" })
              }
              disabled={loading}
            >
              <SelectTrigger id="is_active">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Shift"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
