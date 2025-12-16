import { Shield, User, LogIn } from "lucide-react";

export function ColorLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/30 rounded-xl border border-border">
      <span className="text-sm font-medium text-muted-foreground">Keterangan Warna:</span>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-login-orange" />
        <LogIn className="w-4 h-4 text-login-orange" />
        <span className="text-sm text-foreground">Login / Daftar</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full ring-2 ring-admin-red bg-transparent" />
        <Shield className="w-4 h-4 text-admin-red" />
        <span className="text-sm text-foreground">Data Super Admin</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full ring-2 ring-user-blue bg-transparent" />
        <User className="w-4 h-4 text-user-blue" />
        <span className="text-sm text-foreground">Data Pengguna</span>
      </div>
    </div>
  );
}
