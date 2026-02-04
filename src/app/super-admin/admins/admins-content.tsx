"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Power,
  Shield,
  Mail,
  Phone,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface Admin {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export function AdminsContent() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "admin")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading admins:", error);
        toast.error("Failed to load admins: " + error.message);
      } else {
        setAdmins(data || []);
      }
    } catch (error) {
      console.error("Unexpected error loading admins:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const { toggleAdminStatus: toggleStatus } = await import("./actions");
      const result = await toggleStatus(adminId, currentStatus);

      if (result.success) {
        toast.success(
          `Admin ${!currentStatus ? "activated" : "deactivated"} successfully`,
        );
        loadAdmins();
      } else {
        toast.error(result.error || "Failed to update admin status");
      }
    } catch (error) {
      toast.error("Failed to update admin status");
      console.error(error);
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading admins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Management</h1>
          <p className="text-gray-600">
            Create and manage exam organizing admins
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Create Admin
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Admins</p>
                <p className="mt-1 text-2xl font-bold">{admins.length}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Admins</p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {admins.filter((a) => a.is_active).length}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3">
                <Power className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Admins</p>
                <p className="mt-1 text-2xl font-bold text-red-600">
                  {admins.filter((a) => !a.is_active).length}
                </p>
              </div>
              <div className="rounded-full bg-red-100 p-3">
                <Power className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-none bg-transparent outline-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Admins ({filteredAdmins.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-gray-600">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Last Login</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-gray-500">
                      No admins found
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr key={admin.id} className="border-b last:border-0">
                      <td className="py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {admin.full_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            ID: {admin.id.slice(0, 8)}...
                          </p>
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-1">
                          <p className="flex items-center gap-1 text-sm text-gray-600">
                            <Mail className="h-3 w-3" />
                            {admin.email}
                          </p>
                          {admin.phone && (
                            <p className="flex items-center gap-1 text-sm text-gray-600">
                              <Phone className="h-3 w-3" />
                              {admin.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            admin.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <Power className="h-3 w-3" />
                          {admin.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(admin.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600">
                        {admin.last_login
                          ? new Date(admin.last_login).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              toggleAdminStatus(admin.id, admin.is_active)
                            }
                            className={`rounded p-2 ${
                              admin.is_active
                                ? "bg-red-100 text-red-600 hover:bg-red-200"
                                : "bg-green-100 text-green-600 hover:bg-green-200"
                            }`}
                            title={admin.is_active ? "Deactivate" : "Activate"}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded bg-blue-100 p-2 text-blue-600 hover:bg-blue-200"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="rounded bg-red-100 p-2 text-red-600 hover:bg-red-200"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <CreateAdminModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadAdmins();
          }}
        />
      )}
    </div>
  );
}

interface CreateAdminModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateAdminModal({ onClose, onSuccess }: CreateAdminModalProps) {
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { createAdmin } = await import("./actions");
      const result = await createAdmin(formData);

      if (result.success) {
        toast.success("Admin created successfully!");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to create admin");
      }
    } catch (error) {
      toast.error("Failed to create admin");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="w-full rounded-lg border p-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Temporary Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full rounded-lg border p-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                User will be prompted to change on first login
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? "Creating..." : "Create Admin"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
