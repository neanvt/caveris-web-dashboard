import { ManagerSidebar } from "./sidebar";
import { ManagerHeader } from "./header";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-server";

export async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "manager") {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <ManagerHeader userName={session.fullName} userEmail={session.email} />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <footer className="border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2026 CAVERIS - Biometric Verification System</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-indigo-600">Documentation</a>
              <a href="#" className="hover:text-indigo-600">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
