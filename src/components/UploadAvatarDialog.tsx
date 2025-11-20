import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UploadAvatarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
}

const UploadAvatarDialog = ({
  open,
  onOpenChange,
  onUploaded,
}: UploadAvatarDialogProps) => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!user || !selectedFile) return;

    setUploading(true);
    try {
      const avatarUrl = await profileService.uploadAvatar(user.id, selectedFile);
      
      // Atualizar usuário no contexto
      if (updateUser) {
        updateUser({ ...user, avatar_url: avatarUrl });
      }

      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi atualizada com sucesso.",
      });

      onUploaded?.();
      onOpenChange(false);
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer upload",
        description: error.message || "Não foi possível atualizar a foto.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user) return;

    setUploading(true);
    try {
      await profileService.deleteAvatar(user.id);
      
      if (updateUser) {
        updateUser({ ...user, avatar_url: undefined });
      }

      toast({
        title: "Foto removida",
        description: "Sua foto de perfil foi removida.",
      });

      onUploaded?.();
      onOpenChange(false);
      setSelectedFile(null);
      setPreview(null);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover a foto.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Foto de Perfil</DialogTitle>
          <DialogDescription>
            Adicione uma foto para que outros usuários possam te reconhecer
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview */}
          <div className="flex justify-center">
            <Avatar className="h-32 w-32">
              {preview || user?.avatar_url ? (
                <AvatarImage
                  src={preview || user?.avatar_url}
                  alt={user?.name || "Usuário"}
                />
              ) : null}
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user ? getInitials(user.name) : "U"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* File Input */}
          <div>
            <Label htmlFor="avatar">Selecionar foto</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="mt-1"
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG ou GIF até 5MB
            </p>
          </div>

          {/* Remove Button */}
          {user?.avatar_url && !preview && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={uploading}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Remover foto atual
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedFile(null);
              setPreview(null);
            }}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadAvatarDialog;

