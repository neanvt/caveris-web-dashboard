"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Clock,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Search,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import CreateShiftModal from "@/components/admin/create-shift-modal";
import ViewShiftModal from "@/components/admin/view-shift-modal";
import EditShiftModal from "@/components/admin/edit-shift-modal";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export default function ShiftsContent() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [filteredShifts, setFilteredShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const { toast } = useToast();


  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      const { getShifts } = await import("@/app/actions/supabase-actions");
      const data = await getShifts();
      setShifts(data || []);
      setFilteredShifts(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch shifts";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterShifts = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredShifts(shifts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = shifts.filter(
      (shift) =>
        shift.shift_name.toLowerCase().includes(query) ||
        shift.shift_code.toLowerCase().includes(query),
    );
    setFilteredShifts(filtered);
  }, [searchQuery, shifts]);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  useEffect(() => {
    filterShifts();
  }, [filterShifts]);

  const handleDelete = async (shiftId: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;

    try {
      const { deleteShift } = await import("@/app/actions/supabase-actions");
      const result = await deleteShift(shiftId);

      if (result.error) throw new Error(result.error);

      toast({
        title: "Success",
        description: "Shift deleted successfully",
      });

      fetchShifts();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete shift";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const formatTime = (time: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-orange-600" />
            <div>
              <CardTitle className="text-3xl">Master Shifts</CardTitle>
              <CardDescription>
                Create and manage examination shifts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Actions */}
          <div className="mb-6 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search shifts by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setCreateModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Shift
            </Button>
          </div>

          {/* Shifts Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            </div>
          ) : filteredShifts.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchQuery ? "No shifts found" : "No shifts yet"}
              </h3>
              <p className="mt-2 text-gray-600">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Get started by creating a new shift"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="mt-4 bg-orange-600 hover:bg-orange-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Shift
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Shift Name</TableHead>
                  <TableHead>Shift Code</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.map((shift) => (
                  <TableRow key={shift.id}>
                    <TableCell className="font-medium">
                      {shift.shift_name}
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-gray-100 rounded text-sm">
                        {shift.shift_code}
                      </code>
                    </TableCell>
                    <TableCell>{formatTime(shift.start_time)}</TableCell>
                    <TableCell>{formatTime(shift.end_time)}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedShift(shift);
                                  setViewModalOpen(true);
                                }}
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View shift details</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedShift(shift);
                                  setEditModalOpen(true);
                                }}
                                className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit shift</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(shift.id)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Delete shift</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateShiftModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSuccess={fetchShifts}
      />

      {selectedShift && (
        <>
          <ViewShiftModal
            shift={selectedShift}
            open={viewModalOpen}
            onOpenChange={setViewModalOpen}
          />
          <EditShiftModal
            shift={selectedShift}
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            onSuccess={fetchShifts}
          />
        </>
      )}
    </div>
  );
}
