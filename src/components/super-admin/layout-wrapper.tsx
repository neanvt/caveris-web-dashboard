import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-server";

export async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session) {
    redirect("/login");
  }

  // Ensure user has super_admin role
  if (session.role !== "super_admin") {
    redirect("/login");
  }

  const userData = {
    full_name: session.fullName,
    email: session.email,
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header userName={userData.full_name} userEmail={userData.email} />
        <main className="flex-1 overflow-y-auto">{children}</main>
        <footer className="border-t bg-white px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>© 2026 CAVERIS - Biometric Verification System</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-blue-600">
                Documentation
              </a>
              <a href="#" className="hover:text-blue-600">
                Support
              </a>
              <a href="#" className="hover:text-blue-600">
                Privacy Policy
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
