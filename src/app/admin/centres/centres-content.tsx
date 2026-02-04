"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MapPin,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CreateCentreModal } from "@/components/admin/create-centre-modal";
import { ViewCentreModal } from "@/components/admin/view-centre-modal";
import { EditCentreModal } from "@/components/admin/edit-centre-modal";

interface Centre {
  id: string;
  centre_name: string;
  centre_code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contact_person: string;
  contact_phone: string;
  contact_email: string;
  capacity: number;
  is_active: boolean;
  created_at: string;
}

export function CentresContent() {
  const [centres, setCentres] = useState<Centre[]>([]);
  const [filteredCentres, setFilteredCentres] = useState<Centre[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState<Centre | null>(null);
  const { toast } = useToast();
  const loadCentres = useCallback(async () => {
    try {
      setLoading(true);
      const { getCentres } = await import("@/app/actions/supabase-actions");
      const data = await getCentres();
      setCentres(data || []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load centres";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterCentres = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredCentres(centres);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = centres.filter(
      (centre) =>
        centre.centre_name.toLowerCase().includes(query) ||
        centre.centre_code.toLowerCase().includes(query) ||
        centre.city.toLowerCase().includes(query) ||
        centre.state.toLowerCase().includes(query),
    );

    setFilteredCentres(filtered);
  }, [searchQuery, centres]);

  useEffect(() => {
    loadCentres();
  }, [loadCentres]);

  useEffect(() => {
    filterCentres();
  }, [filterCentres]);

  const handleDelete = async (centreId: string) => {
    if (!confirm("Are you sure you want to delete this centre?")) return;

    try {
      const { deleteCentre } = await import("@/app/actions/supabase-actions");
      const result = await deleteCentre(centreId);

      if (result.error) throw new Error(result.error);

      toast({
        title: "Success",
        description: "Centre deleted successfully",
      });

      loadCentres();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete centre";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleView = (centre: Centre) => {
    setSelectedCentre(centre);
    setShowViewModal(true);
  };

  const handleEdit = (centre: Centre) => {
    setSelectedCentre(centre);
    setShowEditModal(true);
  };

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <MapPin className="h-8 w-8 text-blue-600" />
            <div>
              <CardTitle className="text-3xl">Master Centres</CardTitle>
              <CardDescription>
                Create and manage examination centres
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
                placeholder="Search centres by name, code, city, or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Centre
            </Button>
          </div>

          {/* Centres Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredCentres.length === 0 ? (
            <div className="py-12 text-center">
              <MapPin className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchQuery ? "No centres found" : "No centres yet"}
              </h3>
              <p className="mt-2 text-gray-600">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Get started by creating a new centre"}
              </p>
              {!searchQuery && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Centre
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Centre Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCentres.map((centre) => (
                  <TableRow key={centre.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <p className="font-medium text-gray-900">
                          {centre.centre_name}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {centre.centre_code}
                      </span>
                    </TableCell>
                    <TableCell>{centre.city}</TableCell>
                    <TableCell>{centre.state}</TableCell>
                    <TableCell>{centre.capacity}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-gray-900">{centre.contact_person}</p>
                        <p className="text-gray-500">{centre.contact_phone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={centre.is_active ? "default" : "secondary"}
                        className={
                          centre.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {centre.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex items-center justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(centre)}
                              >
                                <Eye className="h-4 w-4 text-blue-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Centre</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(centre)}
                              >
                                <Pencil className="h-4 w-4 text-orange-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit Centre</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(centre.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Centre</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <CreateCentreModal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          loadCentres();
        }}
      />

      {selectedCentre && (
        <>
          <ViewCentreModal
            open={showViewModal}
            onClose={() => setShowViewModal(false)}
            centre={selectedCentre}
          />

          <EditCentreModal
            open={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              loadCentres();
            }}
            centre={selectedCentre}
          />
        </>
      )}
    </div>
  );
}
