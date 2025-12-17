import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { User, Phone, Mail, MapPin, Plus, Edit, Trash2, Loader2, X, Building2 } from "lucide-react";
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent, useAddAgentUnit, useRemoveAgentUnit } from "@/hooks/useAgents";
import { useUnits } from "@/hooks/useUnits";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const AgentBerkantor = () => {
  const { data: agents, isLoading } = useAgents();
  const { data: units } = useUnits();
  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const deleteMutation = useDeleteAgent();
  const addUnitMutation = useAddAgentUnit();
  const removeUnitMutation = useRemoveAgentUnit();
  const { isSuperAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState("");

  const [form, setForm] = useState({
    name: "",
    position: "",
    phone: "",
    email: "",
    office_location: "",
    photo_url: "",
  });

  const resetForm = () => {
    setForm({ name: "", position: "", phone: "", email: "", office_location: "", photo_url: "" });
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...form });
    } else {
      await createMutation.mutateAsync(form);
    }
    setIsOpen(false);
    resetForm();
  };

  const handleEdit = (agent: typeof agents[0]) => {
    setEditingId(agent.id);
    setForm({
      name: agent.name,
      position: agent.position,
      phone: agent.phone || "",
      email: agent.email || "",
      office_location: agent.office_location || "",
      photo_url: agent.photo_url || "",
    });
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus agent ini?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleAddUnit = async () => {
    if (selectedAgent && selectedUnitId) {
      await addUnitMutation.mutateAsync({ agent_id: selectedAgent, unit_id: selectedUnitId });
      setSelectedUnitId("");
    }
  };

  const handleRemoveUnit = async (unitRelationId: string) => {
    await removeUnitMutation.mutateAsync(unitRelationId);
  };

  const selectedAgentData = agents?.find(a => a.id === selectedAgent);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agent Berkantor</h1>
            <p className="text-muted-foreground">Daftar staff pengelola gedung</p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => { resetForm(); setIsOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Agent
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents?.map((agent, index) => (
            <div
              key={agent.id}
              className="bg-card rounded-xl border border-border p-6 shadow-card hover:shadow-lg transition-all duration-300 animate-slide-up cursor-pointer"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedAgent(agent.id)}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {agent.photo_url ? (
                    <img src={agent.photo_url} alt={agent.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{agent.name}</h3>
                      <p className="text-sm text-accent font-medium mb-3">{agent.position}</p>
                    </div>
                    {isSuperAdmin && (
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(agent)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(agent.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {agent.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{agent.phone}</span>
                      </div>
                    )}
                    {agent.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{agent.email}</span>
                      </div>
                    )}
                    {agent.office_location && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{agent.office_location}</span>
                      </div>
                    )}
                  </div>
                  {agent.agent_units && agent.agent_units.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {agent.agent_units.slice(0, 3).map((au) => (
                        <Badge key={au.id} variant="secondary" className="text-xs">
                          {au.units?.unit_number}
                        </Badge>
                      ))}
                      {agent.agent_units.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{agent.agent_units.length - 3} lainnya
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {agents?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Belum ada agent terdaftar
          </div>
        )}
      </div>

      {/* Add/Edit Agent Dialog */}
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Agent" : "Tambah Agent Baru"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Posisi</Label>
              <Input
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telepon</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lokasi Kantor</Label>
              <Input
                value={form.office_location}
                onChange={(e) => setForm({ ...form, office_location: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>URL Foto</Label>
              <Input
                value={form.photo_url}
                onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingId ? "Update" : "Simpan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Agent Detail Dialog */}
      <Dialog open={!!selectedAgent} onOpenChange={(open) => !open && setSelectedAgent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail Agent</DialogTitle>
          </DialogHeader>
          {selectedAgentData && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                  {selectedAgentData.photo_url ? (
                    <img src={selectedAgentData.photo_url} alt={selectedAgentData.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedAgentData.name}</h3>
                  <p className="text-accent">{selectedAgentData.position}</p>
                </div>
              </div>

              <div className="space-y-2">
                {selectedAgentData.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedAgentData.phone}</span>
                  </div>
                )}
                {selectedAgentData.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedAgentData.email}</span>
                  </div>
                )}
                {selectedAgentData.office_location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedAgentData.office_location}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <Label className="font-semibold">Unit yang Dikuasakan</Label>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedAgentData.agent_units?.map((au) => (
                    <Badge key={au.id} variant="secondary" className="flex items-center gap-1">
                      {au.units?.unit_number}
                      {isSuperAdmin && (
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-destructive" 
                          onClick={() => handleRemoveUnit(au.id)}
                        />
                      )}
                    </Badge>
                  ))}
                  {(!selectedAgentData.agent_units || selectedAgentData.agent_units.length === 0) && (
                    <span className="text-sm text-muted-foreground">Belum ada unit</span>
                  )}
                </div>

                {isSuperAdmin && (
                  <div className="flex gap-2 mt-4">
                    <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Pilih unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units?.filter(u => !selectedAgentData.agent_units?.some(au => au.unit_id === u.id)).map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddUnit} disabled={!selectedUnitId || addUnitMutation.isPending}>
                      {addUnitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default AgentBerkantor;
