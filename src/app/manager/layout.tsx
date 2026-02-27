import { ManagerLayout } from "@/components/manager/layout-wrapper";

export default function ManagerRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ManagerLayout>{children}</ManagerLayout>;
}
