import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopMenu } from "./TopMenu";
import { cn } from "@/lib/utils";
import { useSystemStatus } from "@/hooks/useSystemActivation";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { AlertTriangle } from "lucide-react";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { data: systemStatus } = useSystemStatus();
  const { isSuperAdmin } = useAuth();
  const isMobile = useIsMobile();
  const isSystemInactive = systemStatus?.system_status === "tidak_aktif";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile unless opened */}
      <div className={cn(
        isMobile && !mobileSidebarOpen && "hidden",
        isMobile && mobileSidebarOpen && "block"
      )}>
        <Sidebar
          collapsed={isMobile ? false : sidebarCollapsed}
          onToggle={() => {
            if (isMobile) {
              setMobileSidebarOpen(false);
            } else {
              setSidebarCollapsed(!sidebarCollapsed);
            }
          }}
        />
      </div>

      <TopMenu
        sidebarCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          isMobile ? "pl-0" : (sidebarCollapsed ? "pl-20" : "pl-64")
        )}
      >
        {isSystemInactive && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-4 md:px-6 py-3 flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Sistem AJMS sedang tidak aktif. Sebagian besar fitur tidak dapat digunakan hingga sistem diaktifkan kembali.</span>
          </div>
        )}
        <div className="p-4 md:p-6">{children}</div>
      </main>
    </div>
  );
}
