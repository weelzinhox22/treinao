import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Camera, Upload, Trash2, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fotoService, type Foto } from "@/services/fotoService";
import { workoutPhotoService } from "@/services/workoutPhotoService";
import { supabaseService } from "@/services/supabaseService";
import { useToast } from "@/hooks/use-toast";
import LazyImage from "@/components/LazyImage";

const Fotos = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fotoToDelete, setFotoToDelete] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadFotos();
    }
  }, [user]);

  const loadFotos = () => {
    if (!user) return;
    const userFotos = fotoService.getFotos(user.id);
    setFotos(userFotos);
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "Por favor, selecione uma imagem menor que 5MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Tipo de arquivo inválido",
          description: "Por favor, selecione uma imagem",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!user || !selectedFile || !preview) return;

    setUploading(true);
    try {
      let photoUrl: string;
      
      // Se Supabase está configurado, fazer upload para o Storage
      if (supabaseService.isConfigured()) {
        try {
          photoUrl = await workoutPhotoService.uploadWorkoutPhoto(user.id, selectedFile);
          toast({
            title: "Foto enviada!",
            description: "Sua foto foi salva no Supabase Storage.",
          });
        } catch (error: any) {
          console.error("Erro ao fazer upload para Supabase:", error);
          // Fallback para base64 se o upload falhar
          toast({
            title: "Usando armazenamento local",
            description: "Foto salva localmente (Supabase indisponível).",
            variant: "default",
          });
          photoUrl = await fotoService.fileToBase64(selectedFile);
        }
      } else {
        // Sem Supabase, usar base64
        photoUrl = await fotoService.fileToBase64(selectedFile);
      }
      
      fotoService.addFoto(user.id, photoUrl, description || undefined);
      
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setPreview(null);
      setDescription("");
      loadFotos();
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro ao fazer upload",
        description: "Não foi possível salvar a foto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    setFotoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!user || !fotoToDelete) return;

    const success = fotoService.deleteFoto(fotoToDelete, user.id);
    if (success) {
      toast({
        title: "Foto deletada",
        description: "A foto foi removida com sucesso.",
      });
      loadFotos();
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível deletar a foto.",
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
    setFotoToDelete(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-1">Evolução Física</h1>
            <p className="text-muted-foreground text-sm">
              Registre sua transformação ao longo do tempo
            </p>
          </div>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
                <Upload className="h-4 w-4 mr-2" />
                Upload de Foto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Foto de Progresso</DialogTitle>
                <DialogDescription>
                  Faça upload de uma foto para documentar sua evolução física
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="foto">Foto</Label>
                  <Input
                    id="foto"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="mt-2"
                  />
                  {preview && (
                    <div className="mt-4 relative">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg border border-border"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setPreview(null);
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Ex: 3 meses de treino"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadDialogOpen(false);
                    setPreview(null);
                    setSelectedFile(null);
                    setDescription("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || uploading}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {uploading ? "Enviando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Fotos Grid */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="aspect-square gradient-card border-border/50 animate-pulse">
                <div className="w-full h-full bg-muted rounded-lg"></div>
              </Card>
            ))}
          </div>
        ) : fotos.length === 0 ? (
          <Card className="p-12 gradient-card border-border/50 text-center">
            <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma foto registrada</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Comece a documentar sua evolução física fazendo upload de fotos regularmente
            </p>
            <Button
              onClick={() => setUploadDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Upload className="h-4 w-4 mr-2" />
              Adicionar Primeira Foto
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fotos.map((foto) => (
              <Card
                key={foto.id}
                className="overflow-hidden gradient-card border-border/50 shadow-card hover:shadow-glow transition-smooth"
              >
                <div className="relative aspect-square group">
                  <LazyImage
                    src={foto.url}
                    alt={foto.description || "Foto de progresso"}
                    className="w-full h-full object-cover"
                    placeholder="Carregando..."
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(foto.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    {new Date(foto.date).toLocaleDateString("pt-BR")}
                  </p>
                  {foto.description && (
                    <p className="text-sm">{foto.description}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar foto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A foto será permanentemente removida.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Fotos;
