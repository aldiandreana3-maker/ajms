import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBillRates, useCreateBillRate, useUpdateBillRate, useDeleteBillRate, BillRate } from "@/hooks/useBillRates";
import { Settings, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export function BillRatesCard() {
  const { data: rates, isLoading } = useBillRates();
  const createMutation = useCreateBillRate();
  const updateMutation = useUpdateBillRate();
  const deleteMutation = useDeleteBillRate();

  const [isOpen, setIsOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<BillRate | null>(null);
  const [form, setForm] = useState({ area_label: "", area_sqm: "", quarterly_amount: "" });

  const resetForm = () => {
    setForm({ area_label: "", area_sqm: "", quarterly_amount: "" });
    setEditingRate(null);
  };

  const openEdit = (rate: BillRate) => {
    setEditingRate(rate);
    setForm({
      area_label: rate.area_label,
      area_sqm: rate.area_sqm.toString(),
      quarterly_amount: rate.quarterly_amount.toString(),
    });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = {
      area_label: form.area_label,
      area_sqm: parseFloat(form.area_sqm),
      quarterly_amount: parseFloat(form.quarterly_amount),
    };

    if (editingRate) {
      await updateMutation.mutateAsync({ id: editingRate.id, ...input });
    } else {
      await createMutation.mutateAsync(input);
    }
    setIsOpen(false);
    resetForm();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5 text-primary" />
          Tarif IPL per Tipe Unit
        </CardTitle>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" /> Tambah Tarif
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>{editingRate ? "Edit Tarif" : "Tambah Tarif Baru"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Label Tipe</Label>
                <Input
                  value={form.area_label}
                  onChange={(e) => setForm({ ...form, area_label: e.target.value })}
                  placeholder="Tipe 18.5 m²"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Luas (m²)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={form.area_sqm}
                  onChange={(e) => setForm({ ...form, area_sqm: e.target.value })}
                  placeholder="18.5"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tarif per 3 Bulan (Rp)</Label>
                <Input
                  type="number"
                  value={form.quarterly_amount}
                  onChange={(e) => setForm({ ...form, quarterly_amount: e.target.value })}
                  placeholder="666000"
                  required
                />
              </div>
              {form.quarterly_amount && (
                <p className="text-sm text-muted-foreground">
                  Tarif per bulan: {formatCurrency(Math.round(parseFloat(form.quarterly_amount || "0") / 3))}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingRate ? "Simpan Perubahan" : "Tambah"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipe Unit</TableHead>
                <TableHead>Luas</TableHead>
                <TableHead>Tarif / 3 Bulan</TableHead>
                <TableHead>Tarif / Bulan</TableHead>
                <TableHead className="w-20">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates?.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium">{rate.area_label}</TableCell>
                  <TableCell>{rate.area_sqm} m²</TableCell>
                  <TableCell>{formatCurrency(rate.quarterly_amount)}</TableCell>
                  <TableCell>{formatCurrency(rate.monthly_amount)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(rate)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(rate.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {(!rates || rates.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    Belum ada tarif
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
