import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { extractTextFromFile, chunkArticle } from "@/lib/extractDocText";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}

export function ImportKnowledgeDialog({ open, onOpenChange, onImported }: Props) {
  const [topic, setTopic] = useState("");
  const [article, setArticle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileText, setFileText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setTopic("");
    setArticle("");
    setFile(null);
    setFileText("");
  };

  const handleFile = async (f: File | null) => {
    setFile(f);
    setFileText("");
    if (!f) return;
    setParsing(true);
    try {
      const text = await extractTextFromFile(f);
      setFileText(text);
      if (!topic) setTopic(f.name.replace(/\.[^.]+$/, ""));
      toast.success(`Berhasil ekstrak ${text.length.toLocaleString()} karakter`);
    } catch (e: any) {
      toast.error(e?.message || "Gagal membaca file");
    } finally {
      setParsing(false);
    }
  };

  const saveChunks = async (sourceText: string) => {
    if (!topic.trim()) {
      toast.error("Topik/judul materi wajib diisi");
      return;
    }
    if (!sourceText.trim()) {
      toast.error("Materi kosong");
      return;
    }
    setSaving(true);
    try {
      const chunks = chunkArticle(sourceText, topic.trim());
      if (!chunks.length) {
        toast.error("Tidak ada potongan yang bisa diekstrak");
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      const rows = chunks.map((c) => ({
        question: c.question,
        answer: c.answer,
        keywords: c.keywords,
        is_active: true,
        created_by: u.user?.id,
      }));
      const { error } = await supabase.from("chat_knowledge_base").insert(rows);
      if (error) throw error;
      toast.success(`${chunks.length} potongan materi berhasil ditambahkan`);
      onImported();
      reset();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah Materi ke Knowledge Base</DialogTitle>
          <DialogDescription>
            Tempel artikel panjang atau upload dokumen — sistem otomatis memecahnya menjadi potongan
            yang dapat digunakan auto-reply.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="paste">
              <FileText className="w-4 h-4 mr-2" /> Tempel Artikel
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 mr-2" /> Upload File
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-3 mt-4">
            <div>
              <Label>Topik / Judul Materi</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="contoh: Tata Tertib Hunian"
              />
            </div>
            <div>
              <Label>Isi Artikel</Label>
              <Textarea
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                rows={10}
                placeholder="Tempel teks panjang di sini. Pisahkan paragraf dengan baris kosong."
              />
              <p className="text-xs text-muted-foreground mt-1">
                {article.length.toLocaleString()} karakter — akan dipecah menjadi ±{Math.max(1, Math.ceil(article.length / 600))} potongan
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button onClick={() => saveChunks(article)} disabled={saving || !article.trim()}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan ke KB
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="upload" className="space-y-3 mt-4">
            <div>
              <Label>Topik / Judul Materi</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Otomatis terisi dari nama file"
              />
            </div>
            <div>
              <Label>Pilih File (PDF, DOCX, TXT)</Label>
              <Input
                type="file"
                accept=".pdf,.docx,.txt,.md,text/*"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              {parsing && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Membaca file…
                </p>
              )}
              {file && !parsing && (
                <Badge variant="secondary" className="mt-2">
                  {file.name} · {fileText.length.toLocaleString()} karakter
                </Badge>
              )}
            </div>
            {fileText && (
              <div>
                <Label>Pratinjau Teks (boleh diedit sebelum disimpan)</Label>
                <Textarea
                  value={fileText}
                  onChange={(e) => setFileText(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Akan dipecah menjadi ±{Math.max(1, Math.ceil(fileText.length / 600))} potongan
                </p>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button onClick={() => saveChunks(fileText)} disabled={saving || !fileText.trim()}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Simpan ke KB
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
