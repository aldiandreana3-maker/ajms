import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from "@/hooks/useUserManagement";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ShieldAlert, Loader2, Search, Users, Settings } from "lucide-react";
import { ManageUnitsDialog } from "@/components/akses-unit/ManageUnitsDialog";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
  agent: "Agent",
  penghuni: "Penghuni",
  staff_tro: "Staff TRO",
  staff_finance: "Staff Finance",
  staff_hrd_ga: "Staff HRD/GA",
  staff_engineering: "Staff Engineering",
  staff_outsourcing_cleaning: "Staff Outsourcing Cleaning",
  staff_outsourcing_security: "Staff Outsourcing Security",
  staff_outsourcing_parkir: "Staff Outsourcing Parkir",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-destructive/20 text-destructive border-destructive/30",
  admin: "bg-primary/20 text-primary border-primary/30",
  staff: "bg-info/20 text-info border-info/30",
  agent: "bg-warning/20 text-warning border-warning/30",
  penghuni: "bg-muted text-muted-foreground border-muted",
  staff_tro: "bg-cyan-500/20 text-cyan-600 border-cyan-500/30",
  staff_finance: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  staff_hrd_ga: "bg-violet-500/20 text-violet-600 border-violet-500/30",
  staff_engineering: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  staff_outsourcing_cleaning: "bg-teal-500/20 text-teal-600 border-teal-500/30",
  staff_outsourcing_security: "bg-rose-500/20 text-rose-600 border-rose-500/30",
  staff_outsourcing_parkir: "bg-amber-500/20 text-amber-600 border-amber-500/30",
};

function useUserUnits() {
  return useQuery({
    queryKey: ["user-units-mapping"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("penghuni")
        .select("user_id, unit_number")
        .not("user_id", "is", null);
      if (error) throw error;

      const map = new Map<string, string[]>();
      data?.forEach((row) => {
        if (row.user_id) {
          const existing = map.get(row.user_id) || [];
          if (row.unit_number && !existing.includes(row.unit_number)) {
            existing.push(row.unit_number);
          }
          map.set(row.user_id, existing);
        }
      });
      return map;
    },
  });
}

export default function AksesUnit() {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, isLimitedAccess } = useAuth();
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: unitMap, isLoading: unitsLoading } = useUserUnits();
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<null | { id: string; full_name: string | null; email: string }>(null);
  const canAccess = (isSuperAdmin || isAdmin) && !isLimitedAccess;

  if (!canAccess) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <ShieldAlert className="w-16 h-16 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground">Akses Ditolak</h1>
          <p className="text-muted-foreground text-center max-w-md">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>
        </div>
      </MainLayout>
    );
  }

  const isLoading = usersLoading || unitsLoading;

  const filteredUsers = users?.filter((u) => {
    const q = search.toLowerCase();
    const units = unitMap?.get(u.id) || [];
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      units.some((unit) => unit.toLowerCase().includes(q))
    );
  });

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Akses Unit Pengguna</h1>
              <p className="text-muted-foreground">Daftar akun pengguna dan unit yang dipegang</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle>Daftar Pengguna</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama, email, unit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Unit yang Dipegang</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((u) => {
                    const units = unitMap?.get(u.id) || [];
                    return (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {u.full_name?.charAt(0) || u.email.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{u.full_name || "Belum diatur"}</p>
                              <p className="text-sm text-muted-foreground">{u.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.role ? (
                            <Badge className={roleColors[u.role]}>
                              {roleLabels[u.role]}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Belum ada role</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {units.length > 0 ? (
                              units.map((unit) => (
                                <Badge key={unit} variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                                  {unit}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">Belum ada unit</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {u.is_active ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">Aktif</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Nonaktif</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingUser({ id: u.id, full_name: u.full_name, email: u.email })}
                            className="h-8 w-8"
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredUsers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Tidak ada pengguna ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {editingUser && (
        <ManageUnitsDialog
          open={!!editingUser}
          onOpenChange={(open) => { if (!open) setEditingUser(null); }}
          user={editingUser}
          currentUnits={unitMap?.get(editingUser.id) || []}
        />
      )}
    </MainLayout>
  );
}
