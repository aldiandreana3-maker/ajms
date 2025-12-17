import {
  Home,
  Building,
  FileText,
  BarChart3,
  Settings,
  Bell,
  User,
  Search,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const menuItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Building, label: "Gedung", path: "/struktur-fasilitas" },
  { icon: FileText, label: "Dokumen", path: "/berita" },
  { icon: BarChart3, label: "Statistik", path: "/laporan-keuangan" },
  { icon: Settings, label: "Pengaturan", path: "/profile" },
];

interface TopMenuProps {
  sidebarCollapsed: boolean;
}

export function TopMenu({ sidebarCollapsed }: TopMenuProps) {
  const [activeItem, setActiveItem] = useState("Home");
  const navigate = useNavigate();
  const { user, signOut, role } = useAuth();

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
        sidebarCollapsed ? "left-20" : "left-64"
      )}
    >
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Menu Items */}
        <div className="flex items-center gap-1">
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

          {/* Notification */}
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
          </button>

          {/* Profile Dropdown */}
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
        </div>
      </div>
    </header>
  );
}
