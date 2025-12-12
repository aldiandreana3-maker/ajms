import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const towers = ["A", "B", "C", "D"];
const floors = Array.from({ length: 23 }, (_, i) => i + 1);
const units = Array.from({ length: 32 }, (_, i) => i + 1);

interface UnitSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function UnitSelector({ value, onChange, label = "Unit" }: UnitSelectorProps) {
  const [tower, setTower] = useState("");
  const [floor, setFloor] = useState("");
  const [unit, setUnit] = useState("");

  const formatUnit = (t: string, f: string, u: string) => {
    if (!t || !f || !u) return "";
    const floorStr = f.padStart(2, "0");
    const unitStr = u.padStart(2, "0");
    return `${t}${floorStr}${unitStr}`;
  };

  const handleChange = (type: "tower" | "floor" | "unit", val: string) => {
    let newTower = tower;
    let newFloor = floor;
    let newUnit = unit;

    if (type === "tower") newTower = val;
    if (type === "floor") newFloor = val;
    if (type === "unit") newUnit = val;

    if (type === "tower") setTower(val);
    if (type === "floor") setFloor(val);
    if (type === "unit") setUnit(val);

    const formatted = formatUnit(newTower, newFloor, newUnit);
    onChange(formatted);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        <Select value={tower} onValueChange={(v) => handleChange("tower", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Tower" />
          </SelectTrigger>
          <SelectContent>
            {towers.map((t) => (
              <SelectItem key={t} value={t}>Tower {t}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={floor} onValueChange={(v) => handleChange("floor", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Lantai" />
          </SelectTrigger>
          <SelectContent>
            {floors.map((f) => (
              <SelectItem key={f} value={f.toString()}>Lt. {f}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={unit} onValueChange={(v) => handleChange("unit", v)}>
          <SelectTrigger>
            <SelectValue placeholder="Unit" />
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u} value={u.toString()}>Unit {u}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {value && (
        <p className="text-sm text-muted-foreground">Unit: <span className="font-mono font-medium text-foreground">{value}</span></p>
      )}
    </div>
  );
}
