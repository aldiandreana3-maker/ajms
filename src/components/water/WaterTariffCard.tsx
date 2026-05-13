import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useWaterTariff } from "@/hooks/useWaterTariff";
import { useAuth } from "@/contexts/AuthContext";

export function WaterTariffCard() {
  const { tariff, update, isUpdating, isLoading } = useWaterTariff();
  const { isSuperAdmin, isAdmin, role } = useAuth();
  const canEdit = isSuperAdmin || isAdmin || role === "staff_engineering";

  const [abonemen, setAbonemen] = useState("17000");
  const [pricePerM3, setPricePerM3] = useState("12600");

  useEffect(() => {
    if (!isLoading) {
      setAbonemen(String(tariff.abonemen));
      setPricePerM3(String(tariff.price_per_m3));
    }
  }, [tariff, isLoading]);

  const handleSave = async () => {
    await update({ abonemen: Number(abonemen) || 0, price_per_m3: Number(pricePerM3) || 0 });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Settings className="w-4 h-4" /> Pengaturan Tarif Air
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <div>
            <Label>Abonemen Tetap (Rp)</Label>
            <Input type="number" value={abonemen} onChange={(e) => setAbonemen(e.target.value)} disabled={!canEdit} />
          </div>
          <div>
            <Label>Harga per m³ (Rp)</Label>
            <Input type="number" value={pricePerM3} onChange={(e) => setPricePerM3(e.target.value)} disabled={!canEdit} />
          </div>
          <div>
            {canEdit ? (
              <Button onClick={handleSave} disabled={isUpdating} className="w-full">
                {isUpdating ? "Menyimpan..." : "Simpan Tarif"}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">Hanya Admin/Engineering yang dapat mengubah.</p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Rumus: <strong>Total = Abonemen + (Harga per m³ × pemakaian)</strong>. Tanpa pemakaian tetap dikenakan abonemen.
        </p>
      </CardContent>
    </Card>
  );
}
