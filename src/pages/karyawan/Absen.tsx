import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CameraCapture } from "@/components/shared/CameraCapture";
import { useAuth } from "@/contexts/AuthContext";
import { useTodayAttendance, useEmployeeAttendance, useCheckIn, useCheckOut } from "@/hooks/useEmployeeAttendance";
import { ArrowLeft, UserCheck, LogIn, LogOut, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Absen() {
  const navigate = useNavigate();
  const { user, isStaff, isSuperAdmin, isAdmin } = useAuth();
  const { data: todayAttendance, isLoading: todayLoading } = useTodayAttendance();
  const { data: attendanceList, isLoading: listLoading } = useEmployeeAttendance();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showCheckOut, setShowCheckOut] = useState(false);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);

  if (!isStaff && !isSuperAdmin && !isAdmin) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Akses ditolak</p>
        </div>
      </MainLayout>
    );
  }

  const handleCheckIn = async () => {
    if (!selfieFile) return;
    await checkIn.mutateAsync(selfieFile);
    setSelfieFile(null);
    setShowCheckIn(false);
  };

  const handleCheckOut = async () => {
    if (!selfieFile || !todayAttendance) return;
    await checkOut.mutateAsync({ attendanceId: todayAttendance.id, photoFile: selfieFile });
    setSelfieFile(null);
    setShowCheckOut(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "hadir": return <Badge className="bg-success text-white">Hadir</Badge>;
      case "terlambat": return <Badge variant="destructive">Terlambat</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatTime = (time: string | null) => {
    if (!time) return "-";
    return new Date(time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Absensi</h1>
              <p className="text-muted-foreground">Absen masuk & pulang karyawan</p>
            </div>
          </div>
        </div>

        {/* Today's Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Status Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            {todayLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Jam Masuk</p>
                  <p className="text-2xl font-bold">{formatTime(todayAttendance?.check_in_time ?? null)}</p>
                </div>
                <div className="flex-1 text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Jam Pulang</p>
                  <p className="text-2xl font-bold">{formatTime(todayAttendance?.check_out_time ?? null)}</p>
                </div>
                <div className="flex-1 text-center p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{todayAttendance ? getStatusBadge(todayAttendance.status) : <Badge variant="outline">Belum Absen</Badge>}</div>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-4">
              {!todayAttendance && (
                <Button onClick={() => setShowCheckIn(true)} className="flex-1">
                  <LogIn className="w-4 h-4 mr-2" />Absen Masuk
                </Button>
              )}
              {todayAttendance && !todayAttendance.check_out_time && (
                <Button onClick={() => setShowCheckOut(true)} variant="outline" className="flex-1">
                  <LogOut className="w-4 h-4 mr-2" />Absen Pulang
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Riwayat Kehadiran</CardTitle>
          </CardHeader>
          <CardContent>
            {listLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Jam Masuk</TableHead>
                      <TableHead>Jam Pulang</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceList?.length === 0 && (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Belum ada data absensi</TableCell></TableRow>
                    )}
                    {attendanceList?.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{new Date(a.attendance_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}</TableCell>
                        <TableCell>{formatTime(a.check_in_time)}</TableCell>
                        <TableCell>{formatTime(a.check_out_time)}</TableCell>
                        <TableCell>{getStatusBadge(a.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Check In Dialog */}
        <Dialog open={showCheckIn} onOpenChange={setShowCheckIn}>
          <DialogContent>
            <DialogHeader><DialogTitle>Absen Masuk - Selfie</DialogTitle></DialogHeader>
            <CameraCapture label="Ambil selfie untuk absen masuk" value={selfieFile} onChange={setSelfieFile} required />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowCheckIn(false); setSelfieFile(null); }}>Batal</Button>
              <Button onClick={handleCheckIn} disabled={!selfieFile || checkIn.isPending}>
                {checkIn.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogIn className="w-4 h-4 mr-2" />}
                Absen Masuk
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Check Out Dialog */}
        <Dialog open={showCheckOut} onOpenChange={setShowCheckOut}>
          <DialogContent>
            <DialogHeader><DialogTitle>Absen Pulang - Selfie</DialogTitle></DialogHeader>
            <CameraCapture label="Ambil selfie untuk absen pulang" value={selfieFile} onChange={setSelfieFile} required />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => { setShowCheckOut(false); setSelfieFile(null); }}>Batal</Button>
              <Button onClick={handleCheckOut} disabled={!selfieFile || checkOut.isPending}>
                {checkOut.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LogOut className="w-4 h-4 mr-2" />}
                Absen Pulang
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
