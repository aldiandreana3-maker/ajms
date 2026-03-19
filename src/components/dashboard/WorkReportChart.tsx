import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3 } from "lucide-react";
import { format } from "date-fns";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--warning))",
  "hsl(142 76% 36%)",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
  "hsl(280 67% 50%)",
  "hsl(30 90% 50%)",
];

function useWorkReportData() {
  const today = format(new Date(), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["work-report-chart", today],
    queryFn: async () => {
      const [
        keluhanRes,
        workOrderRes,
        inspectionRes,
        housekeepingRes,
        securityRes,
        packagesRes,
      ] = await Promise.all([
        // TRO - Keluhan
        supabase.from("keluhan").select("status", { count: "exact" }),
        // Engineering - Work Orders
        supabase.from("work_permits").select("status", { count: "exact" }),
        // Engineering - Field Inspections
        supabase.from("field_inspections").select("work_status", { count: "exact" }),
        // Housekeeping
        supabase.from("housekeeping_tasks").select("status", { count: "exact" }).eq("task_date", today),
        // Security
        supabase.from("security_patrols").select("id", { count: "exact" }).eq("patrol_date", today),
        // TRO - Packages
        supabase.from("packages").select("status", { count: "exact" }),
      ]);

      const keluhanData = keluhanRes.data || [];
      const keluhanDone = keluhanData.filter(k => k.status === "resolved" || k.status === "closed").length;
      const keluhanTotal = keluhanData.length;

      const inspectionData = inspectionRes.data || [];
      const inspectionDone = inspectionData.filter(i => i.work_status === "selesai").length;
      const inspectionTotal = inspectionData.length;

      const hkData = housekeepingRes.data || [];
      const hkDone = hkData.filter(h => h.status === "selesai").length;
      const hkTotal = hkData.length;

      const securityTotal = securityRes.data?.length || 0;

      const packageData = packagesRes.data || [];
      const packageDone = packageData.filter(p => p.status === "sudah_diambil").length;
      const packageTotal = packageData.length;

      const workOrderData = workOrderRes.data || [];
      const workOrderDone = workOrderData.filter(w => w.status === "approved").length;
      const workOrderTotal = workOrderData.length;

      return [
        { name: "Tenant Relation", done: keluhanDone, total: keluhanTotal },
        { name: "Engineering", done: inspectionDone, total: inspectionTotal },
        { name: "House Keeping", done: hkDone, total: hkTotal },
        { name: "Security", done: securityTotal, total: securityTotal > 0 ? securityTotal : 0 },
        { name: "Pelayanan Paket", done: packageDone, total: packageTotal },
        { name: "Izin Kerja", done: workOrderDone, total: workOrderTotal },
      ];
    },
  });
}

export function WorkReportChart() {
  const { isAdmin, isSuperAdmin, role } = useAuth();
  const isStaff = isAdmin || isSuperAdmin || (role && role.startsWith("staff"));
  const { data, isLoading } = useWorkReportData();

  const chartData = useMemo(() => {
    if (!data) return [];
    return data
      .filter(d => d.total > 0)
      .map(d => ({
        name: d.name,
        value: Math.round((d.done / d.total) * 100),
        done: d.done,
        total: d.total,
      }));
  }, [data]);

  if (!isStaff) return null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Laporan Kerja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-6">Belum ada data laporan kerja</p>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
          <p className="font-semibold text-foreground">{d.name}</p>
          <p className="text-muted-foreground">Selesai: {d.done}/{d.total} ({d.value}%)</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
        {value}%
      </text>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="w-5 h-5 text-primary" />
          Laporan Kerja
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={90}
                innerRadius={35}
                dataKey="value"
                paddingAngle={2}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="horizontal"
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: "11px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Detail list */}
        <div className="mt-2 space-y-2">
          {chartData.map((d, i) => (
            <div key={d.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-foreground">{d.name}</span>
              </div>
              <span className="text-muted-foreground font-medium">{d.done}/{d.total} ({d.value}%)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
