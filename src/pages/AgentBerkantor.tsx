import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Plus, Loader2 } from "lucide-react";
import { useAgents, useCreateAgent, useUpdateAgent, useDeleteAgent, useAddAgentUnit, useRemoveAgentUnit } from "@/hooks/useAgents";
import { useUnits } from "@/hooks/useUnits";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agent/AgentCard";
import { AgentDetailDialog } from "@/components/agent/AgentDetailDialog";
import { AgentFormDialog } from "@/components/agent/AgentFormDialog";
import { toast } from "sonner";

const AgentBerkantor = () => {
  const { data: agents, isLoading } = useAgents();
  const { units } = useUnits();
  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const deleteMutation = useDeleteAgent();
  const addUnitMutation = useAddAgentUnit();
  const removeUnitMutation = useRemoveAgentUnit();
  const { isSuperAdmin } = useAuth();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [unitInput, setUnitInput] = useState("");

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
    setIsFormOpen(false);
    resetForm();
  };

  const handleEdit = (agent: NonNullable<typeof agents>[0]) => {
    setEditingId(agent.id);
    setForm({
      name: agent.name,
      position: agent.position,
      phone: agent.phone || "",
      email: agent.email || "",
      office_location: agent.office_location || "",
      photo_url: agent.photo_url || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus agent ini?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleAddUnit = async () => {
    if (selectedAgent && unitInput.trim()) {
      // Find unit by unit_number
      const matchedUnit = units?.find(u => u.unit_number.toLowerCase() === unitInput.trim().toLowerCase());
      if (matchedUnit) {
        await addUnitMutation.mutateAsync({ agent_id: selectedAgent, unit_id: matchedUnit.id });
        setUnitInput("");
      } else {
        // If no exact match, try partial match
        const partialMatch = units?.find(u => u.unit_number.toLowerCase().includes(unitInput.trim().toLowerCase()));
        if (partialMatch) {
          await addUnitMutation.mutateAsync({ agent_id: selectedAgent, unit_id: partialMatch.id });
          setUnitInput("");
        } else {
          toast.error("Unit tidak ditemukan. Pastikan nomor unit benar.");
        }
      }
    }
  };

  const handleRemoveUnit = async (unitRelationId: string) => {
    await removeUnitMutation.mutateAsync(unitRelationId);
  };

  const selectedAgentData = agents?.find(a => a.id === selectedAgent) ?? null;

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
            <p className="text-muted-foreground">Daftar agent yang menyewakan unit apartemen</p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => { resetForm(); setIsFormOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Agent
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {agents?.map((agent, index) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              index={index}
              isSuperAdmin={isSuperAdmin}
              onClick={() => setSelectedAgent(agent.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {agents?.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            Belum ada agent terdaftar
          </div>
        )}
      </div>

      {/* Add/Edit Agent Form Dialog */}
      <AgentFormDialog
        open={isFormOpen}
        onOpenChange={(open) => { setIsFormOpen(open); if (!open) resetForm(); }}
        editingId={editingId}
        form={form}
        onFormChange={setForm}
        onSubmit={handleSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
      />

      {/* Agent Detail Dialog with Gallery */}
      <AgentDetailDialog
        agent={selectedAgentData}
        open={!!selectedAgent}
        onOpenChange={(open) => !open && setSelectedAgent(null)}
        isSuperAdmin={isSuperAdmin}
        units={units}
        unitInput={unitInput}
        onUnitInputChange={setUnitInput}
        onAddUnit={handleAddUnit}
        onRemoveUnit={handleRemoveUnit}
        isAddingUnit={addUnitMutation.isPending}
        onPhotoUpdated={() => {
          // Refetch agents to get updated photo
          window.location.reload();
        }}
      />
    </MainLayout>
  );
};

export default AgentBerkantor;
