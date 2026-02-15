import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopMenu } from "./TopMenu";
import { cn } from "@/lib/utils";
import { useSystemStatus } from "@/hooks/useSystemActivation";
import { useAuth } from "@/contexts/AuthContext";
import { AlertTriangle } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const { data: systemStatus } = useSystemStatus();
  const { isSuperAdmin } = useAuth();
  const isSystemInactive = systemStatus?.system_status === "tidak_aktif";

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <TopMenu sidebarCollapsed={sidebarCollapsed} />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "pl-20" : "pl-64"
        )}
      >
        {isSystemInactive && !isSuperAdmin && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-6 py-3 flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Sistem AJMS sedang tidak aktif. Beberapa fitur mungkin tidak tersedia.</span>
          </div>
        )}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
