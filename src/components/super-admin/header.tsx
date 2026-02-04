"use client";

import { Bell, LogOut, Settings, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  userName: string;
  userEmail: string;
}

export function Header({ userName, userEmail }: HeaderProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login" as any);
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Welcome back!</h2>
        <p className="text-sm text-gray-500">{userEmail}</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-100"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">Super Admin</p>
            </div>
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border bg-white shadow-lg">
              <button
                onClick={() => router.push("/super-admin/profile" as any)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4" />
                Profile
              </button>
              <button
                onClick={() => router.push("/super-admin/settings" as any)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <hr className="my-1" />
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
