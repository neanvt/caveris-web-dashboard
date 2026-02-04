"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Settings,
  User,
  Bell,
  Shield,
  Mail,
  Smartphone,
  Key,
} from "lucide-react";

export function SettingsContent() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" defaultValue="Amar Singh" />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="amar.singh@example.com"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" defaultValue="+91 9876543210" />
                </div>
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    defaultValue="Civil Services Board"
                  />
                </div>
              </div>
              <Button className="bg-green-600 hover:bg-green-700">
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <Key className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Change Password</p>
                    <p className="text-sm text-gray-600">
                      Last changed 15 days ago
                    </p>
                  </div>
                </div>
                <Button variant="outline">Update</Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Smartphone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      Two-Factor Authentication
                    </p>
                    <p className="text-sm text-gray-600">
                      Add an extra layer of security
                    </p>
                  </div>
                </div>
                <Button variant="outline">Enable</Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-100 p-2">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Active Sessions</p>
                    <p className="text-sm text-gray-600">
                      Manage your login sessions
                    </p>
                  </div>
                </div>
                <Button variant="outline">View</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-green-600" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    Email Notifications
                  </p>
                  <p className="text-sm text-gray-600">
                    Receive updates via email
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 rounded border-gray-300 text-green-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">SMS Alerts</p>
                  <p className="text-sm text-gray-600">
                    Get verification alerts via SMS
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 rounded border-gray-300 text-green-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Daily Summary</p>
                  <p className="text-sm text-gray-600">
                    Daily report of verifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-green-600"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">System Alerts</p>
                  <p className="text-sm text-gray-600">
                    Important system notifications
                  </p>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-5 w-5 rounded border-gray-300 text-green-600"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exam Defaults */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              Exam Defaults
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="maxAttempts">
                  Default Max Verification Attempts
                </Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  defaultValue="3"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Default Verification Methods</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300 text-green-600"
                    />
                    <span className="text-sm text-gray-900">
                      Face Recognition
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 rounded border-gray-300 text-green-600"
                    />
                    <span className="text-sm text-gray-900">Fingerprint</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-green-600"
                    />
                    <span className="text-sm text-gray-900">Iris Scan</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-green-600"
                    />
                    <span className="text-sm text-gray-900">
                      Aadhaar Verification
                    </span>
                  </label>
                </div>
              </div>

              <Button className="bg-green-600 hover:bg-green-700">
                Save Defaults
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
