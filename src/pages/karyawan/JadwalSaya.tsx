import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ShiftCalendarView } from "@/components/shift/ShiftCalendarView";
import { useShifts } from "@/hooks/useShifts";

export default function JadwalSaya() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: shifts = [] } = useShifts();

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Jadwal Saya</h1>
              <p className="text-muted-foreground">Jadwal shift kerja Anda</p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle>Kalender Jadwal</CardTitle></CardHeader>
          <CardContent>
            <ShiftCalendarView userIdFilter={user?.id} canManage={false} />
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
              {shifts.map((s) => (
                <div key={s.id} className="flex items-center gap-1.5 text-sm">
                  <span className="w-3 h-3 rounded" style={{ background: s.color }} />
                  {s.name} <span className="text-muted-foreground text-xs">({s.start_time?.slice(0,5)}–{s.end_time?.slice(0,5)})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
