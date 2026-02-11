import { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface UnitOption {
  label: string;
  value: string;
}

function generateAllUnits(): UnitOption[] {
  const units: UnitOption[] = [];
  const towers = ["A", "B", "C", "D"];

  // Residential: Tower A-D, Floor 1-23, Unit 1-35
  for (const tower of towers) {
    for (let floor = 1; floor <= 23; floor++) {
      for (let unit = 1; unit <= 35; unit++) {
        const floorStr = floor.toString().padStart(2, "0");
        const unitStr = unit.toString().padStart(2, "0");
        const code = `${tower}${floorStr}${unitStr}`;
        units.push({ label: `T${tower} Lt.${floor} Unit ${unit} (${code})`, value: code });
      }
    }
  }

  // Commercial: A1-A40, B1-B40, C1-C40, D1-D40
  for (const tower of towers) {
    for (let num = 1; num <= 40; num++) {
      const code = `K-${tower}${num.toString().padStart(2, "0")}`;
      units.push({ label: `Komersial ${tower}-${num} (${code})`, value: code });
    }
  }

  return units;
}

const ALL_UNITS = generateAllUnits();

interface UnitComboboxProps {
  value: string;
  onChange: (value: string) => void;
}

export function UnitCombobox({ value, onChange }: UnitComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return ALL_UNITS.slice(0, 50); // show first 50 by default
    const q = search.toLowerCase();
    return ALL_UNITS.filter((u) => u.label.toLowerCase().includes(q) || u.value.toLowerCase().includes(q)).slice(0, 50);
  }, [search]);

  const selectedLabel = ALL_UNITS.find((u) => u.value === value)?.label;

  return (
    <div className="space-y-2">
      <Label>Unit</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between font-normal">
            {selectedLabel || "Ketik atau pilih unit..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Cari unit... (cth: A0101, B12)" value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>Unit tidak ditemukan</CommandEmpty>
              <CommandGroup>
                {filtered.map((u) => (
                  <CommandItem
                    key={u.value}
                    value={u.value}
                    onSelect={() => {
                      onChange(u.value);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === u.value ? "opacity-100" : "opacity-0")} />
                    {u.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
