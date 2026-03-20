import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, BarChart3, ArrowRight } from "lucide-react";
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
      // Use HEAD/count queries to avoid fetching all rows (packages has 12k+ rows)
      const [
        keluhanTotal,
        keluhanDone,
        inspectionTotal,
        inspectionDone,
        hkTotal,
        hkDone,
        securityTotal,
        packageTotal,
        packageDone,
        workOrderTotal,
        workOrderDone,
      ] = await Promise.all([
        supabase.from("keluhan").select("id", { count: "exact", head: true }),
        supabase.from("keluhan").select("id", { count: "exact", head: true }).eq("status", "selesai"),
        supabase.from("field_inspections").select("id", { count: "exact", head: true }),
        supabase.from("field_inspections").select("id", { count: "exact", head: true }).eq("work_status", "selesai"),
        supabase.from("housekeeping_tasks").select("id", { count: "exact", head: true }).eq("task_date", today),
        supabase.from("housekeeping_tasks").select("id", { count: "exact", head: true }).eq("task_date", today).eq("status", "selesai"),
        supabase.from("security_patrols").select("id", { count: "exact", head: true }).eq("patrol_date", today),
        supabase.from("packages").select("id", { count: "exact", head: true }),
        supabase.from("packages").select("id", { count: "exact", head: true }).eq("status", "diambil"),
        supabase.from("work_permits").select("id", { count: "exact", head: true }),
        supabase.from("work_permits").select("id", { count: "exact", head: true }).eq("status", "approved"),
      ]);

      return [
        { name: "Tenant Relation", done: keluhanDone.count || 0, total: keluhanTotal.count || 0 },
        { name: "Engineering", done: inspectionDone.count || 0, total: inspectionTotal.count || 0 },
        { name: "House Keeping", done: hkDone.count || 0, total: hkTotal.count || 0 },
        { name: "Security", done: securityTotal.count || 0, total: securityTotal.count || 0 },
        { name: "Pelayanan Paket", done: packageDone.count || 0, total: packageTotal.count || 0 },
        { name: "Izin Kerja", done: workOrderDone.count || 0, total: workOrderTotal.count || 0 },
      ];
    },
  });
}

export function WorkReportChart() {
  const { isAdmin, isSuperAdmin, role } = useAuth();
  const navigate = useNavigate();
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="w-5 h-5 text-primary" />
            Laporan Kerja
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/kepengelolaan/laporan-kerja")}>
            Detail <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
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
