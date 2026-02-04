"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, Calendar, Shield, Edit } from "lucide-react";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  created_at: string;
  is_active: boolean;
}

export function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
      });
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from("users")
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      setEditing(false);
      loadProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-gray-600">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600">Manage your personal information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-600 text-3xl font-bold text-white">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-900">
                {profile.full_name}
              </h2>
              <p className="text-sm text-gray-600">{profile.email}</p>
              <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                <Shield className="h-4 w-4" />
                Admin
              </span>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Joined {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm">
                  <span
                    className={`h-2 w-2 rounded-full ${profile.is_active ? "bg-green-500" : "bg-gray-500"}`}
                  ></span>
                  <span className="text-gray-600">
                    {profile.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Personal Information</CardTitle>
            {!editing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      full_name: profile.full_name,
                      phone: profile.phone || "",
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  {editing ? (
                    <Input
                      id="fullName"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 rounded-md border p-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">{profile.full_name}</span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="flex items-center gap-2 rounded-md border bg-gray-50 p-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900">{profile.email}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Email cannot be changed
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  {editing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  ) : (
                    <div className="flex items-center gap-2 rounded-md border p-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-900">
                        {profile.phone || "Not set"}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="role">Role</Label>
                  <div className="flex items-center gap-2 rounded-md border bg-gray-50 p-3">
                    <Shield className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-900 capitalize">
                      {profile.role}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Role cannot be changed
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Statistics */}
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Total Exams</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">
              Total Candidates
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Verifications</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-600">Active Users</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
