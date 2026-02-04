"use client";

import { useState } from "react";
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
import { toast } from "sonner";
import { Loader2, Clock } from "lucide-react";

interface CreateShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function CreateShiftModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateShiftModalProps) {
  const [formData, setFormData] = useState({
    shift_name: "",
    shift_code: "",
    gate_open_time: "",
    gate_close_time: "",
    start_time: "",
    end_time: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);


  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.shift_name.trim()) {
      newErrors.shift_name = "Shift name is required";
    }

    if (!formData.shift_code.trim()) {
      newErrors.shift_code = "Shift code is required";
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

      const { createShift } = await import("@/app/actions/supabase-actions");
      const result = await createShift({
        shift_name: formData.shift_name.trim(),
        shift_code: formData.shift_code.trim(),
        gate_open_time: formData.gate_open_time,
        gate_close_time: formData.gate_close_time,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });

      if (result.error) throw new Error(result.error);

      toast.success("Shift created successfully");
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create shift";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      shift_name: "",
      shift_code: "",
      gate_open_time: "",
      gate_close_time: "",
      start_time: "",
      end_time: "",
    });
    setErrors({});
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !loading) {
      resetForm();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <DialogTitle>Create New Shift</DialogTitle>
              <DialogDescription>
                Add a new shift to your schedule
              </DialogDescription>
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
            <Label htmlFor="shift_code">
              Shift Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="shift_code"
              placeholder="e.g., MS001"
              value={formData.shift_code}
              onChange={(e) =>
                setFormData({ ...formData, shift_code: e.target.value })
              }
              className={errors.shift_code ? "border-red-500" : ""}
              disabled={loading}
            />
            {errors.shift_code && (
              <p className="text-sm text-red-500">{errors.shift_code}</p>
            )}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
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
                  Creating...
                </>
              ) : (
                "Create Shift"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
