"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MapPin, Building2, Phone, Mail, Users } from "lucide-react";

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
}

interface ViewCentreModalProps {
  open: boolean;
  onClose: () => void;
  centre: Centre;
}

export function ViewCentreModal({
  open,
  onClose,
  centre,
}: ViewCentreModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-125"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">Centre Details</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          {/* Name and Code */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Centre Name
              </p>
              <p className="font-semibold text-gray-900">
                {centre.centre_name}
              </p>
            </div>

            <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-gray-500">Centre Code</p>
              <p className="font-mono font-semibold text-gray-900">
                {centre.centre_code}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </p>
            <p className="font-semibold text-gray-900">{centre.address}</p>
            <p className="text-sm text-gray-600">
              {centre.city}, {centre.state} - {centre.pincode}
            </p>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-gray-500">Contact Person</p>
              <p className="font-semibold text-gray-900">
                {centre.contact_person || "N/A"}
              </p>
            </div>

            <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Phone
              </p>
              <p className="font-semibold text-gray-900">
                {centre.contact_phone || "N/A"}
              </p>
            </div>
          </div>

          {/* Email and Capacity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Email
              </p>
              <p className="font-semibold text-gray-900">
                {centre.contact_email || "N/A"}
              </p>
            </div>

            <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Capacity
              </p>
              <p className="font-semibold text-gray-900">{centre.capacity}</p>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-gray-500">Status</p>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
