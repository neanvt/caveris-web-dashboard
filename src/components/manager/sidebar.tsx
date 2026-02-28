"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  MapPin,
  Users,
  BarChart3,
  BarChart2,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/manager/dashboard", icon: LayoutDashboard },
  { name: "My Centres", href: "/manager/centres", icon: MapPin },
  { name: "Candidates", href: "/manager/candidates", icon: Users },
  { name: "Analytics", href: "/manager/analytics", icon: BarChart2 },
  { name: "Reports", href: "/manager/reports", icon: BarChart3 },
];

export function ManagerSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`flex h-full flex-col border-r bg-white transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center justify-between border-b px-3">
        {!isCollapsed ? (
          <>
            <div className="flex items-center">
              <Shield className="mr-2 h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">CAVERIS</h1>
                <p className="text-xs text-gray-500">Manager Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="rounded-lg p-1.5 hover:bg-gray-100"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className="mx-auto rounded-lg p-1.5 hover:bg-gray-100"
            title="Expand sidebar"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href as any}
              className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              }`}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={`h-5 w-5 ${!isCollapsed && "mr-3"} flex-shrink-0`}
              />
              {!isCollapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="border-t p-4">
          <p className="text-xs text-gray-500">Version 1.0.0</p>
          <p className="text-xs text-gray-400">© 2026 CAVERIS</p>
        </div>
      )}
    </div>
  );
}
