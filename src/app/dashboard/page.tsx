import { AppShell } from "@/components/app-shell";
import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <AppShell title="" hideTopNav>
      <DashboardWorkspace />
    </AppShell>
  );
}

