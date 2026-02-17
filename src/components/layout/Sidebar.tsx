import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Layers,
  FileBarChart,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Receipt,
  Newspaper,
  Shield,
  FolderKanban,
  Headphones,
  Wallet,
  UserCog,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Menu items with isSuperAdminOnly flag for red indicator
const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", isSuperAdminOnly: false, staffOnly: false },
  { icon: Receipt, label: "Sistem Tagihan", path: "/sistem-tagihan", isSuperAdminOnly: false, staffOnly: true },
  { icon: Users, label: "Tentang Kami", path: "/tentang-kami", isSuperAdminOnly: true, staffOnly: false },
  { icon: Building2, label: "Agent Berkantor", path: "/agent-berkantor", isSuperAdminOnly: true, staffOnly: false },
  { icon: Layers, label: "Struktur Fasilitas", path: "/struktur-fasilitas", isSuperAdminOnly: true, staffOnly: false },
  { icon: FileBarChart, label: "Laporan Keuangan", path: "/laporan-keuangan", isSuperAdminOnly: true, staffOnly: false },
  { icon: Newspaper, label: "Berita", path: "/berita", isSuperAdminOnly: true, staffOnly: false },
];

// Kepengelolaan submenu items - restructured with departments
const kepengelolaanItems = [
  { icon: Headphones, label: "Tenant Relation Office", path: "/kepengelolaan/tro" },
  { icon: Wallet, label: "Finance", path: "/kepengelolaan/finance" },
  { icon: UserCog, label: "HRD & GA", path: "/kepengelolaan/hrd-ga" },
];

const adminMenuItems = [
  { icon: Shield, label: "Manajemen User", path: "/manajemen-user", adminOnly: true },
  { icon: Settings, label: "Aktivasi Sistem", path: "/aktivasi-sistem", adminOnly: false },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isSuperAdmin, isAdmin, isStaff, isLimitedAccess, user, role } = useAuth();
  const [kepengelolaanOpen, setKepengelolaanOpen] = useState(
    location.pathname.startsWith("/kepengelolaan")
  );
  
  // Hide kepengelolaan from penghuni and agent, except Finance
  const canAccessKepengelolaan = (isSuperAdmin || isAdmin) && !isLimitedAccess;
  const canAccessFinance = !!user; // All logged-in users can access Finance

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Building2 className="w-6 h-6 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">AJMS</h1>
              <p className="text-xs text-sidebar-foreground/60">Property Management</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menuItems
          .filter((item) => !item.staffOnly || isStaff)
          .map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
              {!collapsed && (
                <span className="font-medium text-sm truncate">{item.label}</span>
              )}
            </NavLink>
          );
        })}

        {/* Kepengelolaan Menu - Hidden from penghuni and agent */}
        {canAccessKepengelolaan && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2">
                <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-3">
                  Kepengelolaan
                </span>
              </div>
            )}
            {collapsed ? (
              // Collapsed view - show icons only
              kepengelolaanItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0 mx-auto" />
                  </NavLink>
                );
              })
            ) : (
              // Expanded view - show collapsible menu
              <Collapsible open={kepengelolaanOpen} onOpenChange={setKepengelolaanOpen}>
                <CollapsibleTrigger className="flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                  <FolderKanban className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm truncate flex-1 text-left">Kepengelolaan</span>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", kepengelolaanOpen && "rotate-180")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4">
                  {kepengelolaanItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium text-sm truncate">{item.label}</span>
                      </NavLink>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            )}
          </>
        )}

        {/* Tagihan Saya shortcut for penghuni/agent (limited access users) */}
        {!canAccessKepengelolaan && canAccessFinance && (
          <NavLink
            to="/sistem-tagihan"
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
              location.pathname === "/sistem-tagihan"
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Receipt className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
            {!collapsed && (
              <span className="font-medium text-sm truncate">Tagihan Saya</span>
            )}
          </NavLink>
        )}


        {(isSuperAdmin || isAdmin || role === "staff_tro" || role === "staff_finance") && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2">
                <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-3">
                  Admin
                </span>
              </div>
            )}
            {adminMenuItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
                  {!collapsed && (
                    <span className="font-medium text-sm truncate">{item.label}</span>
                  )}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-3 rounded-lg text-sidebar-foreground/70 hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
          )}
        >
          <LogOut className={cn("w-5 h-5 flex-shrink-0", collapsed && "mx-auto")} />
          {!collapsed && <span className="font-medium text-sm">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
