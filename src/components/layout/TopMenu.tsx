import {
  Home,
  Building,
  FileText,
  BarChart3,
  Settings,
  Bell,
  BellOff,
  User,
  Search,
  LogOut,
  LogIn,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useBroadcastMessages } from "@/hooks/useBroadcastMessages";
import { useNotificationMute } from "@/hooks/useRealtimeNotifications";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const menuItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Building, label: "Gedung", path: "/struktur-fasilitas" },
  { icon: FileText, label: "Dokumen", path: "/berita" },
  { icon: BarChart3, label: "Statistik", path: "/laporan-keuangan" },
  { icon: Settings, label: "Pengaturan", path: "/profile" },
];

interface TopMenuProps {
  sidebarCollapsed: boolean;
  isMobile?: boolean;
  onMobileMenuToggle?: () => void;
}

export function TopMenu({ sidebarCollapsed, isMobile, onMobileMenuToggle }: TopMenuProps) {
  const [activeItem, setActiveItem] = useState("Home");
  const navigate = useNavigate();
  const { user, signOut, role } = useAuth();
  const { unreadCount } = useBroadcastMessages();
  const { muted, toggleMute } = useNotificationMute();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleMenuClick = (item: typeof menuItems[0]) => {
    setActiveItem(item.label);
    navigate(item.path);
  };

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    staff: "Staff",
    agent: "Agent",
    penghuni: "Penghuni",
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-card border-b border-border transition-all duration-300",
        isMobile ? "left-0" : (sidebarCollapsed ? "left-20" : "left-64")
      )}
    >
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Mobile hamburger */}
        {isMobile && (
          <button
            onClick={onMobileMenuToggle}
            className="p-2 rounded-lg hover:bg-muted transition-colors mr-2"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        )}
        {/* Left: Menu Items */}
        <div className="flex items-center gap-1 overflow-x-auto flex-shrink min-w-0">
          {menuItems.map((item) => {
            const isActive = activeItem === item.label;
            return (
              <button
                key={item.label}
                onClick={() => handleMenuClick(item)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium hidden md:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari..."
              className="bg-transparent border-none outline-none text-sm w-40 placeholder:text-muted-foreground"
            />
          </div>

          {/* Mute toggle */}
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={toggleMute}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                  aria-label={muted ? "Aktifkan suara notifikasi" : "Matikan suara notifikasi"}
                >
                  {muted ? (
                    <BellOff className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Bell className="w-5 h-5 text-primary" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>{muted ? "Suara notifikasi: OFF" : "Suara notifikasi: ON"}</TooltipContent>
            </Tooltip>
          )}

          {/* Notification (inbox bell) */}
          <button
            onClick={() => navigate("/kepenghunian/pesan")}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Buka pesan"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {/* Profile Dropdown - Only show when logged in */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-foreground">{user?.email?.split("@")[0] || "User"}</p>
                    <p className="text-xs text-muted-foreground">{role ? roleLabels[role] : "User"}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  Profil Saya
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Pengaturan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => navigate("/auth")}
              className="bg-login-orange hover:bg-login-orange/90 text-login-orange-foreground shadow-lg"
            >
              <LogIn className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Login / Daftar</span>
              <span className="sm:hidden">Login</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
