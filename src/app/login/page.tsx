"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { setAuthData } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call .NET API for authentication
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Include cookies
      });

      if (!response.ok) {
        throw new Error("Invalid email or password");
      }

      const data = await response.json();
      console.log("Login successful, response data:", data);

      // Map API response to AuthResponse format
      // Backend returns: { token, refreshToken, userId, email, role, fullName, requiresPasswordChange, expiresAt }
      const authData = {
        userId: data.userId,
        email: data.email,
        role: data.role,
        fullName: data.fullName || data.email?.split('@')[0] || 'User',
        token: data.token,
        refreshToken: data.refreshToken,
        requiresPasswordChange: data.requiresPasswordChange || false,
        expiresAt: data.expiresAt,
      };

      // Use centralized auth utility to set cookie and sessionStorage
      setAuthData(authData);

      // Set cookie for middleware and server-side authentication check
      // Store session data as JSON (not just the token)
      const sessionData = {
        userId: authData.userId,
        email: authData.email,
        role: authData.role,
        fullName: authData.fullName,
      };
      const expiryDate = authData.expiresAt ? new Date(authData.expiresAt) : new Date(Date.now() + 60 * 60 * 1000);
      const cookieValue = encodeURIComponent(JSON.stringify(sessionData));
      document.cookie = `caveris_auth=${cookieValue}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Strict`;

      toast.success("Login successful!");

      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if user needs to change password
      if (authData.requiresPasswordChange) {
        toast.info("Please change your password to continue");
        window.location.href = "/change-password";
        return;
      }

      // Redirect based on role
      const role = authData.role?.toLowerCase();
      let redirectPath = "/admin/dashboard"; // default

      if (role === "super_admin" || role === "super_admin") {
        redirectPath = "/super-admin/dashboard";
      } else if (role === "admin") {
        redirectPath = "/admin/dashboard";
      } else if (role === "manager") {
        redirectPath = "/manager/dashboard";
      } else if (role === "verifier") {
        redirectPath = "/verifier/dashboard";
      } else {
        console.error("Invalid user role received:", authData.role);
        toast.error("Invalid user role: " + authData.role);
        return;
      }

      console.log("Redirecting to:", redirectPath);

      // Use window.location for reliable redirect
      window.location.href = redirectPath;
    } catch (error: any) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6 text-primary"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold">CAVERIS</CardTitle>
          <CardDescription>Candidate Verification System</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@caveris.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
