import { useState } from "react";
import { User, Phone, Mail, MapPin, Building2, X, Plus, Trash2, ImagePlus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAgentGallery, useAddGalleryImage, useDeleteGalleryImage, useUploadGalleryImage } from "@/hooks/useAgentGallery";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface AgentWithUnits {
  id: string;
  name: string;
  position: string;
  phone: string | null;
  email: string | null;
  office_location: string | null;
  photo_url: string | null;
  agent_units?: {
    id: string;
    unit_id: string;
    units?: { unit_number: string } | null;
  }[];
}

interface Unit {
  id: string;
  unit_number: string;
}

interface AgentDetailDialogProps {
  agent: AgentWithUnits | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSuperAdmin: boolean;
  units?: Unit[];
  selectedUnitId: string;
  onSelectUnit: (value: string) => void;
  onAddUnit: () => void;
  onRemoveUnit: (id: string) => void;
  isAddingUnit: boolean;
}

export function AgentDetailDialog({
  agent,
  open,
  onOpenChange,
  isSuperAdmin,
  units,
  selectedUnitId,
  onSelectUnit,
  onAddUnit,
  onRemoveUnit,
  isAddingUnit,
}: AgentDetailDialogProps) {
  const { data: galleryImages, isLoading: isLoadingGallery } = useAgentGallery(agent?.id ?? null);
  const addGalleryImage = useAddGalleryImage();
  const deleteGalleryImage = useDeleteGalleryImage();
  const uploadGalleryImage = useUploadGalleryImage();
  
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !agent) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    try {
      const publicUrl = await uploadGalleryImage.mutateAsync({ file, agentId: agent.id });
      await addGalleryImage.mutateAsync({ 
        agent_id: agent.id, 
        image_url: publicUrl,
        caption: caption || undefined
      });
      setCaption("");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!agent) return;
    if (confirm("Apakah Anda yakin ingin menghapus foto ini?")) {
      await deleteGalleryImage.mutateAsync({ id: imageId, agent_id: agent.id });
    }
  };

  if (!agent) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Agent</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Agent Info */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center overflow-hidden flex-shrink-0">
                {agent.photo_url ? (
                  <img src={agent.photo_url} alt={agent.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-primary-foreground" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold">{agent.name}</h3>
                <p className="text-accent">{agent.position}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              {agent.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${agent.phone}`} className="hover:underline">{agent.phone}</a>
                </div>
              )}
              {agent.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${agent.email}`} className="hover:underline">{agent.email}</a>
                </div>
              )}
              {agent.office_location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{agent.office_location}</span>
                </div>
              )}
            </div>

            {/* Units Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                <Label className="font-semibold">Unit yang Disewakan</Label>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {agent.agent_units?.map((au) => (
                  <Badge key={au.id} variant="secondary" className="flex items-center gap-1">
                    {au.units?.unit_number}
                    {isSuperAdmin && (
                      <X 
                        className="w-3 h-3 cursor-pointer hover:text-destructive" 
                        onClick={() => onRemoveUnit(au.id)}
                      />
                    )}
                  </Badge>
                ))}
                {(!agent.agent_units || agent.agent_units.length === 0) && (
                  <span className="text-sm text-muted-foreground">Belum ada unit</span>
                )}
              </div>

              {isSuperAdmin && (
                <div className="flex gap-2 mt-2">
                  <Select value={selectedUnitId} onValueChange={onSelectUnit}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Pilih unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units?.filter(u => !agent.agent_units?.some(au => au.unit_id === u.id)).map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={onAddUnit} disabled={!selectedUnitId || isAddingUnit}>
                    {isAddingUnit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </Button>
                </div>
              )}
            </div>

            {/* Gallery Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImagePlus className="w-4 h-4" />
                  <Label className="font-semibold">Galeri Unit</Label>
                </div>
                
                {isSuperAdmin && (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      placeholder="Caption (opsional)"
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      className="w-40 h-8 text-sm"
                    />
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <Button size="sm" variant="outline" asChild disabled={isUploading}>
                        <span>
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              Tambah Foto
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                )}
              </div>

              {isLoadingGallery ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : galleryImages && galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {galleryImages.map((image) => (
                    <div key={image.id} className="group relative">
                      <AspectRatio ratio={4/3} className="bg-muted rounded-lg overflow-hidden">
                        <img
                          src={image.image_url}
                          alt={image.caption || "Gallery image"}
                          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedImage(image.image_url)}
                        />
                      </AspectRatio>
                      {image.caption && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">{image.caption}</p>
                      )}
                      {isSuperAdmin && (
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                  <ImagePlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Belum ada foto di galeri</p>
                  {isSuperAdmin && <p className="text-xs mt-1">Klik "Tambah Foto" untuk menambahkan</p>}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2">
          <img
            src={selectedImage || ""}
            alt="Preview"
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
