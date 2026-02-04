"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  MapPin,
  Cake,
} from "lucide-react";
import { format } from "date-fns";

interface Manager {
  id: string;
  full_name: string;
  father_name: string | null;
  email: string;
  phone: string;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  is_active: boolean;
  created_at: string;
}

interface ViewManagerModalProps {
  open: boolean;
  onClose: () => void;
  manager: Manager | null;
}

export function ViewManagerModal({
  open,
  onClose,
  manager,
}: ViewManagerModalProps) {
  if (!manager) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[500px]"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Manager Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Profile Section */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-2xl font-bold text-purple-600">
              {manager.full_name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {manager.full_name}
              </h3>
              <Badge variant={manager.is_active ? "default" : "secondary"}>
                {manager.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <User className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Father's Name</p>
                <p className="font-medium text-gray-900">
                  {manager.father_name || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{manager.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Phone className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium text-gray-900">
                  {manager.phone || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Cake className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-900">
                  {manager.date_of_birth
                    ? format(new Date(manager.date_of_birth), "PP")
                    : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">
                  {manager.address || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <MapPin className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">City</p>
                <p className="font-medium text-gray-900">
                  {manager.city || "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(manager.created_at), "PPP")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <Shield className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Role</p>
                <p className="font-medium text-gray-900">Manager</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
