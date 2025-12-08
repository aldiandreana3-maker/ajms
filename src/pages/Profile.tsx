import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProfile, useUpdateProfile, useUpdatePassword, useUpdateEmail } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { User, Mail, Phone, Shield, Loader2, Save, Lock, Camera } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { role } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const updatePasswordMutation = useUpdatePassword();
  const updateEmailMutation = useUpdateEmail();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);

  const handleStartEdit = () => {
    setFullName(profile?.full_name || "");
    setPhone(profile?.phone || "");
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    await updateProfileMutation.mutateAsync({
      full_name: fullName,
      phone: phone || undefined,
    });
    setIsEditingProfile(false);
  };

  const handleUpdateEmail = async () => {
    if (!newEmail) {
      toast.error("Email tidak boleh kosong");
      return;
    }
    await updateEmailMutation.mutateAsync(newEmail);
    setIsEditingEmail(false);
    setNewEmail("");
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("Password minimal 6 karakter");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Password tidak cocok");
      return;
    }
    await updatePasswordMutation.mutateAsync(newPassword);
    setIsEditingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  const roleLabels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    staff: "Staff",
    agent: "Agent",
    penghuni: "Penghuni",
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profil Saya</h1>
            <p className="text-muted-foreground">Kelola informasi akun Anda</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Informasi Profil</span>
              {!isEditingProfile && (
                <Button variant="outline" size="sm" onClick={handleStartEdit}>
                  Edit
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{profile?.full_name || "Nama belum diatur"}</h3>
                <p className="text-muted-foreground">{profile?.email}</p>
                {role && (
                  <Badge className="mt-2" variant="secondary">
                    <Shield className="w-3 h-3 mr-1" />
                    {roleLabels[role] || role}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {isEditingProfile ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Lengkap</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap"
                  />
                </div>
                <div className="space-y-2">
                  <Label>No. Telepon</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Simpan
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Nama Lengkap</p>
                    <p className="font-medium">{profile?.full_name || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">No. Telepon</p>
                    <p className="font-medium">{profile?.phone || "-"}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Email Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email
              </div>
              {!isEditingEmail && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingEmail(true)}>
                  Ganti Email
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingEmail ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Baru</Label>
                  <Input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@baru.com"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdateEmail} disabled={updateEmailMutation.isPending}>
                    {updateEmailMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Update Email
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditingEmail(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <p className="font-medium">{profile?.email}</p>
            )}
          </CardContent>
        </Card>

        {/* Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Password
              </div>
              {!isEditingPassword && (
                <Button variant="outline" size="sm" onClick={() => setIsEditingPassword(true)}>
                  Ganti Password
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditingPassword ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Password Baru</Label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Konfirmasi Password</Label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleUpdatePassword} disabled={updatePasswordMutation.isPending}>
                    {updatePasswordMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Update Password
                  </Button>
                  <Button variant="outline" onClick={() => {
                    setIsEditingPassword(false);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}>
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">••••••••</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
