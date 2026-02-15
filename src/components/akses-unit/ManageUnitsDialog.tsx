import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface ManageUnitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    full_name: string | null;
    email: string;
  };
  currentUnits: string[]; // unit_numbers
}

export function ManageUnitsDialog({ open, onOpenChange, user, currentUnits }: ManageUnitsDialogProps) {
  const queryClient = useQueryClient();
  const [selectedUnit, setSelectedUnit] = useState("");

  // Fetch distinct unit_numbers from penghuni table
  const { data: penghuniUnits } = useQuery({
    queryKey: ["penghuni-distinct-units"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("penghuni")
        .select("unit_number, unit_id")
        .not("unit_number", "is", null)
        .order("unit_number", { ascending: true });
      if (error) throw error;
      // Deduplicate by unit_number
      const seen = new Set<string>();
      return (data || []).filter((row) => {
        if (!row.unit_number || seen.has(row.unit_number)) return false;
        seen.add(row.unit_number);
        return true;
      });
    },
  });

  const unitOptions = penghuniUnits
    ?.filter((u) => !currentUnits.includes(u.unit_number!))
    .map((u) => ({ value: u.unit_number!, label: u.unit_number! })) || [];

  const addUnit = useMutation({
    mutationFn: async (unitNumber: string) => {
      const pu = penghuniUnits?.find((u) => u.unit_number === unitNumber);
      const unitId = pu?.unit_id;
      if (!unitId) throw new Error("Unit tidak ditemukan");
      // Check if penghuni record already exists for this user+unit
      const { data: existing } = await supabase
        .from("penghuni")
        .select("id")
        .eq("user_id", user.id)
        .eq("unit_id", unitId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("penghuni")
          .update({ is_active: true, unit_number: unitNumber })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, phone")
          .eq("id", user.id)
          .maybeSingle();

        const { error } = await supabase.from("penghuni").insert({
          user_id: user.id,
          unit_id: unitId,
          unit_number: unitNumber,
          full_name: profile?.full_name || user.email,
          email: profile?.email || user.email,
          phone: profile?.phone || null,
          is_active: true,
          is_owner: false,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-units-mapping"] });
      queryClient.invalidateQueries({ queryKey: ["penghuni"] });
      queryClient.invalidateQueries({ queryKey: ["penghuni-distinct-units"] });
      setSelectedUnit("");
      toast.success("Unit berhasil ditambahkan");
    },
    onError: (err) => toast.error("Gagal menambah unit: " + err.message),
  });

  const removeUnit = useMutation({
    mutationFn: async (unitNumber: string) => {
      const { error } = await supabase
        .from("penghuni")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("unit_number", unitNumber)
        .eq("is_active", true);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-units-mapping"] });
      queryClient.invalidateQueries({ queryKey: ["penghuni"] });
      toast.success("Unit berhasil dihapus");
    },
    onError: (err) => toast.error("Gagal menghapus unit: " + err.message),
  });

  const isProcessing = addUnit.isPending || removeUnit.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Kelola Unit - {user.full_name || user.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Unit yang dipegang saat ini:</p>
            <div className="flex flex-wrap gap-2 min-h-[32px]">
              {currentUnits.length > 0 ? (
                currentUnits.map((unit) => (
                  <Badge key={unit} variant="outline" className="bg-primary/5 border-primary/20 text-primary gap-1 pr-1">
                    {unit}
                    <button
                      onClick={() => removeUnit.mutate(unit)}
                      disabled={isProcessing}
                      className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">Belum ada unit</span>
              )}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Tambah Unit</p>
              <Combobox
                options={unitOptions.map((u) => u.value)}
                value={selectedUnit}
                onChange={setSelectedUnit}
                placeholder="Pilih unit..."
                searchPlaceholder="Cari unit..."
                emptyText="Unit tidak ditemukan"
              />
            </div>
            <Button
              size="sm"
              onClick={() => {
                if (selectedUnit) addUnit.mutate(selectedUnit);
              }}
              disabled={!selectedUnit || isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Tambah
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
