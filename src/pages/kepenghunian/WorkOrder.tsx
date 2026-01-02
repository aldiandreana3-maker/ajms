import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Loader2, Trash2, Edit, Download } from "lucide-react";
import { DataFilterBar, DateFilterType, filterByDate } from "@/components/shared/DataFilterBar";
import { LoginPromptButton } from "@/components/shared/LoginPromptButton";
import { useAuth } from "@/contexts/AuthContext";
import { useUnits } from "@/hooks/useUnits";
import {
  useWorkOrders,
  useCreateWorkOrder,
  useUpdateWorkOrderStatus,
  useDeleteWorkOrder,
  WorkOrder as WorkOrderType,
} from "@/hooks/useWorkOrders";
import { exportToExcel } from "@/lib/exportExcel";

const statusColors = {
  pending: "bg-warning/20 text-warning border-warning/30",
  in_progress: "bg-info/20 text-info border-info/30",
  completed: "bg-success/20 text-success border-success/30",
};

const statusLabels = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Selesai",
};

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
};

const workOrderExportColumns = [
  { header: "Tanggal", key: "created_at", width: 18 },
  { header: "Unit", key: "unit_number", width: 12 },
  { header: "Judul", key: "title", width: 25 },
  { header: "Deskripsi", key: "description", width: 35 },
  { header: "Prioritas", key: "priority", width: 12 },
  { header: "Status", key: "status", width: 15 },
  { header: "Tanggal Selesai", key: "completed_at", width: 18 },
];

export default function WorkOrder() {
  const navigate = useNavigate();
  const { user, isStaff } = useAuth();
  const { data: workOrders, isLoading } = useWorkOrders();
  const { data: units } = useUnits();
  const createWorkOrder = useCreateWorkOrder();
  const updateStatus = useUpdateWorkOrderStatus();
  const deleteWorkOrder = useDeleteWorkOrder();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<"pending" | "in_progress" | "completed">("pending");
  const [searchValue, setSearchValue] = useState("");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");

  const [form, setForm] = useState({
    title: "",
    description: "",
    unit_id: "",
    priority: "medium",
  });

  const filteredData = useMemo(() => {
    if (!workOrders) return [];

    // Apply date filter
    const dateFiltered = filterByDate(workOrders as (WorkOrderType & { created_at: string })[], dateFilter);

    // Apply search filter
    return dateFiltered.filter((order) => {
      const matchSearch =
        order.title.toLowerCase().includes(searchValue.toLowerCase()) ||
        order.units?.unit_number?.toLowerCase().includes(searchValue.toLowerCase()) ||
        order.description?.toLowerCase().includes(searchValue.toLowerCase());

      return matchSearch;
    });
  }, [workOrders, searchValue, dateFilter]);

  const handleExport = () => {
    const exportData = filteredData.map((order) => ({
      created_at: order.created_at
        ? new Date(order.created_at).toLocaleDateString("id-ID")
        : "-",
      unit_number: order.units?.unit_number || "-",
      title: order.title,
      description: order.description || "-",
      priority: order.priority || "medium",
      status: statusLabels[order.status],
      completed_at: order.completed_at
        ? new Date(order.completed_at).toLocaleDateString("id-ID")
        : "-",
    }));

    exportToExcel({
      filename: "work-orders",
      sheetName: "Work Orders",
      data: exportData,
      columns: workOrderExportColumns,
    });
  };

  const handleSubmit = async () => {
    if (!form.title) {
      return;
    }

    await createWorkOrder.mutateAsync({
      title: form.title,
      description: form.description || undefined,
      unit_id: form.unit_id || null,
      priority: form.priority,
    });

    setForm({ title: "", description: "", unit_id: "", priority: "medium" });
    setIsOpen(false);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;

    await updateStatus.mutateAsync({
      id: selectedOrder,
      status: newStatus,
    });

    setSelectedOrder(null);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Work Order</h1>
              <p className="text-muted-foreground">
                Kelola work order dan perawatan
              </p>
            </div>
          </div>

          {!user ? (
            <LoginPromptButton />
          ) : isStaff ? (
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Buat Work Order
                </Button>
              </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Buat Work Order Baru</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Judul Work Order *</Label>
                      <Input
                        value={form.title}
                        onChange={(e) =>
                          setForm({ ...form, title: e.target.value })
                        }
                        placeholder="Masukkan judul work order"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Deskripsi</Label>
                      <Textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        placeholder="Deskripsi pekerjaan"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Unit (Opsional)</Label>
                      <Select
                        value={form.unit_id}
                        onValueChange={(value) =>
                          setForm({ ...form, unit_id: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units?.map((unit) => (
                            <SelectItem key={unit.id} value={unit.id}>
                              {unit.unit_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Prioritas</Label>
                      <Select
                        value={form.priority}
                        onValueChange={(value) =>
                          setForm({ ...form, priority: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih prioritas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      disabled={createWorkOrder.isPending || !form.title}
                      className="w-full"
                    >
                      {createWorkOrder.isPending && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      Simpan
                    </Button>
                  </div>
              </DialogContent>
            </Dialog>
          ) : null}
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Work Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <DataFilterBar
                searchValue={searchValue}
                onSearchChange={setSearchValue}
                dateFilter={dateFilter}
                onDateFilterChange={setDateFilter}
                searchPlaceholder="Cari judul, unit..."
              />
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Prioritas</TableHead>
                    <TableHead>Status</TableHead>
                    {isStaff && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Belum ada data work order
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          {order.created_at
                            ? new Date(order.created_at).toLocaleDateString(
                                "id-ID"
                              )
                            : "-"}
                        </TableCell>
                        <TableCell>{order.units?.unit_number || "-"}</TableCell>
                        <TableCell className="font-medium">
                          {order.title}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {order.description || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              priorityColors[
                                order.priority as keyof typeof priorityColors
                              ] || priorityColors.medium
                            }
                          >
                            {order.priority || "medium"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusColors[order.status]}
                          >
                            {statusLabels[order.status]}
                          </Badge>
                        </TableCell>
                        {isStaff && (
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setSelectedOrder(order.id);
                                      setNewStatus(order.status);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Update Status</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <Label>Status</Label>
                                      <Select
                                        value={newStatus}
                                        onValueChange={(value) =>
                                          setNewStatus(
                                            value as
                                              | "pending"
                                              | "in_progress"
                                              | "completed"
                                          )
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">
                                            Pending
                                          </SelectItem>
                                          <SelectItem value="in_progress">
                                            In Progress
                                          </SelectItem>
                                          <SelectItem value="completed">
                                            Selesai
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      onClick={handleUpdateStatus}
                                      disabled={updateStatus.isPending}
                                      className="w-full"
                                    >
                                      {updateStatus.isPending && (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      )}
                                      Update Status
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Hapus Work Order
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus work
                                      order ini? Tindakan ini tidak dapat
                                      dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteWorkOrder.mutate(order.id)
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
