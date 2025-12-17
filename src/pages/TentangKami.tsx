import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Building2, Users, Award, Target, Edit, Loader2 } from "lucide-react";
import { useAboutUs, useUpdateAboutUs } from "@/hooks/useAboutUs";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Users,
  Award,
  Target,
};

const colorMap: Record<string, string> = {
  "visi": "bg-primary",
  "misi": "bg-success",
  "tim": "bg-info",
  "pengalaman": "bg-warning",
};

const TentangKami = () => {
  const { data: sections, isLoading } = useAboutUs();
  const updateMutation = useUpdateAboutUs();
  const { isSuperAdmin } = useAuth();
  
  const [editingSection, setEditingSection] = useState<{
    id: string;
    title: string;
    content: string;
  } | null>(null);

  const handleEdit = (section: { id: string; title: string; content: string }) => {
    setEditingSection(section);
  };

  const handleSave = async () => {
    if (!editingSection) return;
    await updateMutation.mutateAsync({
      id: editingSection.id,
      title: editingSection.title,
      content: editingSection.content,
    });
    setEditingSection(null);
  };

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
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Tentang Kami</h1>
          <p className="text-muted-foreground text-lg">
            AJMS - Sistem Manajemen Properti Terpercaya
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections?.map((section) => {
            const IconComponent = iconMap[section.icon_name || "Building2"] || Building2;
            const bgColor = colorMap[section.section_key] || "bg-primary";
            
            return (
              <div key={section.id} className="bg-card rounded-xl border border-border p-6 shadow-card relative group">
                {isSuperAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleEdit({
                      id: section.id,
                      title: section.title,
                      content: section.content,
                    })}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                <div className={`w-12 h-12 rounded-xl ${bgColor} flex items-center justify-center mb-4`}>
                  <IconComponent className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">{section.title}</h3>
                <p className="text-muted-foreground">{section.content}</p>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Konten</DialogTitle>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Judul</Label>
                <Input
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Konten</Label>
                <Textarea
                  value={editingSection.content}
                  onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })}
                  rows={4}
                />
              </div>
              <Button 
                onClick={handleSave} 
                className="w-full"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default TentangKami;
