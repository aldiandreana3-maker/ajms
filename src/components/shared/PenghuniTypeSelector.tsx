import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface PenghuniTypeSelectorProps {
  penghuniType: string;
  onPenghuniTypeChange: (value: string) => void;
  penghuniName: string;
  onPenghuniNameChange: (value: string) => void;
  agentName?: string;
  onAgentNameChange?: (value: string) => void;
  showAgentField?: boolean;
}

export function PenghuniTypeSelector({
  penghuniType,
  onPenghuniTypeChange,
  penghuniName,
  onPenghuniNameChange,
  agentName = "",
  onAgentNameChange,
  showAgentField = true,
}: PenghuniTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Nama Penghuni</Label>
        <Input
          value={penghuniName}
          onChange={(e) => onPenghuniNameChange(e.target.value)}
          placeholder="Masukkan nama penghuni"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Status Penghuni</Label>
        <Select value={penghuniType} onValueChange={onPenghuniTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pemilik">Pemilik</SelectItem>
            <SelectItem value="penyewa">Penyewa</SelectItem>
            <SelectItem value="agent">Agent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showAgentField && (penghuniType === "penyewa" || penghuniType === "agent") && (
        <div className="space-y-2">
          <Label>{penghuniType === "penyewa" ? "Sewa dari siapa" : "Nama Agent"}</Label>
          <Input
            value={agentName}
            onChange={(e) => onAgentNameChange?.(e.target.value)}
            placeholder={penghuniType === "penyewa" ? "Nama pemilik/agent" : "Nama agent"}
          />
        </div>
      )}
    </div>
  );
}
