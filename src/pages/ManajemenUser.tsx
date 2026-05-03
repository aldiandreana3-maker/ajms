import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useUsers, useUpdateUserRole, useUpdateUserStatus } from "@/hooks/useUserManagement";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Loader2, Shield, UserCheck, UserX, KeyRound, Copy, Check, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "master_dev" | "super_admin" | "admin" | "staff" | "agent" | "penghuni" | "staff_tro" | "staff_finance" | "staff_hrd_ga" | "staff_engineering" | "staff_building_service" | "staff_outsourcing_cleaning" | "staff_outsourcing_security" | "staff_outsourcing_parkir";

const roleLabels: Record<string, string> = {
  master_dev: "Master Development",
  super_admin: "Super Admin",
  admin: "Admin",
  staff: "Staff",
  agent: "Agent",
  penghuni: "Penghuni",
  staff_tro: "Staff TRO",
  staff_finance: "Staff Finance",
  staff_hrd_ga: "Staff HRD/GA",
  staff_engineering: "Staff Engineering",
  staff_building_service: "Staff Building Service",
  staff_outsourcing_cleaning: "Staff Outsourcing Cleaning",
  staff_outsourcing_security: "Staff Outsourcing Security",
  staff_outsourcing_parkir: "Staff Outsourcing Parkir",
};

const roleColors: Record<string, string> = {
  master_dev: "bg-purple-600/20 text-purple-600 border-purple-600/30",
  super_admin: "bg-destructive/20 text-destructive border-destructive/30",
  admin: "bg-primary/20 text-primary border-primary/30",
  staff: "bg-info/20 text-info border-info/30",
  agent: "bg-warning/20 text-warning border-warning/30",
  penghuni: "bg-muted text-muted-foreground border-muted",
  staff_tro: "bg-cyan-500/20 text-cyan-600 border-cyan-500/30",
  staff_finance: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  staff_hrd_ga: "bg-violet-500/20 text-violet-600 border-violet-500/30",
  staff_engineering: "bg-orange-500/20 text-orange-600 border-orange-500/30",
  staff_building_service: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  staff_outsourcing_cleaning: "bg-teal-500/20 text-teal-600 border-teal-500/30",
  staff_outsourcing_security: "bg-rose-500/20 text-rose-600 border-rose-500/30",
  staff_outsourcing_parkir: "bg-amber-500/20 text-amber-600 border-amber-500/30",
};

const HIDDEN_MASTER_EMAILS = ["admin@ajms.com", "admin_ajms@ajms.com"];

const isHiddenMasterAccount = (email: string, role: AppRole | null) => {
  const normalizedEmail = email.trim().toLowerCase();
  return HIDDEN_MASTER_EMAILS.includes(normalizedEmail) || role === "master_dev";
};

// Roles available for selection - master_dev never shown, super_admin only for master_dev
const getSelectableRoles = (isMasterDev: boolean) => {
  const roles = [
    { value: "admin", label: "Admin" },
    { value: "agent", label: "Agent" },
    { value: "staff_tro", label: "Staff TRO" },
    { value: "staff_finance", label: "Staff Finance" },
    { value: "staff_hrd_ga", label: "Staff HRD/GA" },
    { value: "staff_engineering", label: "Staff Engineering" },
    { value: "staff_building_service", label: "Staff Building Service" },
    { value: "staff_outsourcing_cleaning", label: "Staff Outsourcing Cleaning" },
    { value: "staff_outsourcing_security", label: "Staff Outsourcing Security" },
    { value: "staff_outsourcing_parkir", label: "Staff Outsourcing Parkir" },
    { value: "penghuni", label: "Penghuni" },
  ];
  if (isMasterDev) {
    roles.unshift({ value: "master_dev", label: "Master Development" });
    roles.splice(1, 0, { value: "super_admin", label: "Super Admin" });
  }
  return roles;
};

export default function ManajemenUser() {
  const { isSuperAdmin, isAdmin, isMasterDev, user: currentUser } = useAuth();
  const isDeveloper = isMasterDev;

  const { data: users, isLoading } = useUsers();
  const updateRoleMutation = useUpdateUserRole();
  const updateStatusMutation = useUpdateUserStatus();

  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<AppRole>("penghuni");
  
  // Password reset state
  const [resetPasswordUser, setResetPasswordUser] = useState<{ id: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleteUser, setDeleteUser] = useState<{ id: string; email: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const canManageAccount = isMasterDev || isSuperAdmin; // delete + toggle status
  const visibleUsers = users?.filter((u) => isMasterDev || !isHiddenMasterAccount(u.email, u.role)) ?? [];

  const handleUpdateRole = async () => {
    if (selectedUser) {
      await updateRoleMutation.mutateAsync({ userId: selectedUser, role: newRole });
      setSelectedUser(null);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    await updateStatusMutation.mutateAsync({ userId, isActive: !isActive });
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser) return;
    
    setIsResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please login again.");
        return;
      }

      const response = await supabase.functions.invoke("reset-user-password", {
        body: { userId: resetPasswordUser.id, userEmail: resetPasswordUser.email },
      });

      if (response.error) {
        toast.error("Gagal reset password");
        console.error(response.error);
      } else if (response.data?.newPassword) {
        setNewPassword(response.data.newPassword);
        toast.success("Password berhasil direset!");
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      toast.error("Gagal reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    toast.success("Password berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  };

  const closeResetDialog = () => {
    setResetPasswordUser(null);
    setNewPassword("");
    setCopied(false);
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;
    setIsDeleting(true);
    try {
      const response = await supabase.functions.invoke("delete-user-account", {
        body: { userId: deleteUser.id },
      });
      if (response.error || (response.data && response.data.error)) {
        const msg = response.data?.error || response.error?.message || "Gagal menghapus user";
        toast.error(msg);
      } else {
        toast.success("User berhasil dihapus");
        queryClient.invalidateQueries({ queryKey: ["users"] });
        setDeleteUser(null);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal menghapus user");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Shield className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Akses Ditolak</h2>
          <p className="text-muted-foreground">Halaman ini hanya dapat diakses oleh Super Admin dan Admin</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Manajemen User</h1>
            <p className="text-muted-foreground">Kelola akun dan role pengguna</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar User</CardTitle>
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
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terdaftar</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleUsers.map((u) => (
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
                        <div className="flex items-center gap-2">
                          {u.is_active ? (
                            <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                              <UserCheck className="w-3 h-3 mr-1" />
                              Aktif
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                              <UserX className="w-3 h-3 mr-1" />
                              Nonaktif
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(u.created_at), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog open={selectedUser === u.id} onOpenChange={(open) => !open && setSelectedUser(null)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(u.id);
                                  setNewRole(u.role || "penghuni");
                                }}
                              disabled={(!isMasterDev && u.id === currentUser?.id) || (!isMasterDev && (u.role === "super_admin" || u.role === "master_dev"))}
                            >
                              <Shield className="w-4 h-4 mr-1" />
                              Role
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ubah Role User</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Role</Label>
                                  <Select value={newRole} onValueChange={(v) => setNewRole(v as AppRole)}>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                     <SelectContent position="popper" side="bottom" align="start" className="max-h-60 overflow-y-auto">
                                      {getSelectableRoles(isMasterDev).map((role) => (
                                        <SelectItem key={role.value} value={role.value}>
                                          {role.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <Button onClick={handleUpdateRole} disabled={updateRoleMutation.isPending} className="w-full">
                                  {updateRoleMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                  Simpan
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Reset Password Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setResetPasswordUser({ id: u.id, email: u.email })}
                            disabled={u.id === currentUser?.id || (!isMasterDev && (u.role === "super_admin" || u.role === "master_dev"))}
                          >
                            <KeyRound className="w-4 h-4 mr-1" />
                            Reset
                          </Button>

                          <div className="flex items-center gap-2">
                            <Switch
                              checked={u.is_active}
                              onCheckedChange={() => handleToggleStatus(u.id, u.is_active)}
                              disabled={!canManageAccount || u.id === currentUser?.id || updateStatusMutation.isPending || (!isMasterDev && (u.role === "super_admin" || u.role === "master_dev"))}
                            />
                          </div>

                          {/* Delete User Button - master_dev & super_admin only */}
                          {canManageAccount && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteUser({ id: u.id, email: u.email })}
                              disabled={u.id === currentUser?.id || (!isMasterDev && (u.role === "super_admin" || u.role === "master_dev"))}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Hapus
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {visibleUsers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        Tidak ada user terdaftar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Reset Password Dialog */}
        <Dialog open={!!resetPasswordUser} onOpenChange={(open) => !open && closeResetDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Password User</DialogTitle>
              <DialogDescription>
                Reset password untuk: {resetPasswordUser?.email}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {!newPassword ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Klik tombol di bawah untuk generate password baru secara otomatis. 
                    Password lama user akan diganti.
                  </p>
                  <Button 
                    onClick={handleResetPassword} 
                    disabled={isResetting} 
                    className="w-full"
                  >
                    {isResetting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Mereset Password...
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4 mr-2" />
                        Generate Password Baru
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Password Baru</Label>
                    <div className="flex gap-2">
                      <Input value={newPassword} readOnly className="font-mono text-lg" />
                      <Button variant="outline" size="icon" onClick={copyToClipboard}>
                        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Salin password ini dan berikan ke user. Password hanya ditampilkan sekali.
                    </p>
                  </div>
                  <Button onClick={closeResetDialog} variant="outline" className="w-full">
                    Tutup
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete User Confirmation */}
        <AlertDialog open={!!deleteUser} onOpenChange={(open) => !open && !isDeleting && setDeleteUser(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Akun User?</AlertDialogTitle>
              <AlertDialogDescription>
                Akun <span className="font-semibold">{deleteUser?.email}</span> akan dihapus permanen beserta akses login. Tindakan ini tidak bisa dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => { e.preventDefault(); handleDeleteUser(); }}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
