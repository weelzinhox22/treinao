import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { groupPostsService } from "@/services/groupPostsService";
import { workoutPhotoService } from "@/services/workoutPhotoService";
import EmojiPicker from "./EmojiPicker";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  userId: string;
  userName: string;
  userAvatarUrl?: string;
  onPostCreated: () => void;
}

const CreatePostDialog = ({
  open,
  onOpenChange,
  groupId,
  userId,
  userName,
  userAvatarUrl,
  onPostCreated,
}: CreatePostDialogProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [workoutType, setWorkoutType] = useState<string>("musculacao");
  const [duration, setDuration] = useState("30");
  const [moodEmoji, setMoodEmoji] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "Máximo 10MB",
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

  const handleSubmit = async () => {
    if (!title.trim() || !workoutType || !duration) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título, tipo e duração.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      let photoUrl: string | undefined;

      // Upload da foto se existir
      if (selectedFile) {
        photoUrl = await workoutPhotoService.uploadWorkoutPhoto(userId, selectedFile);
      }

      // Calcular pontos
      const multipliers: Record<string, number> = {
        musculacao: 3.0,
        cardio: 2.0,
        yoga: 1.5,
        outro: 2.0,
      };
      const points = Math.round(parseInt(duration) * multipliers[workoutType]);

      // Criar post
      await groupPostsService.createPost({
        group_id: groupId,
        user_id: userId,
        user_name: userName,
        user_avatar_url: userAvatarUrl,
        title: title.trim(),
        description: description.trim() || undefined,
        workout_type: workoutType as any,
        duration_minutes: parseInt(duration),
        photo_url: photoUrl,
        mood_emoji: moodEmoji || undefined,
        points,
      });

      // Limpar form
      setTitle("");
      setDescription("");
      setWorkoutType("musculacao");
      setDuration("30");
      setMoodEmoji("");
      setSelectedFile(null);
      setPreview(null);

      onPostCreated();
    } catch (error) {
      console.error("Erro ao criar post:", error);
      toast({
        title: "Erro ao publicar",
        description: "Não foi possível criar o post. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Compartilhar Treino</DialogTitle>
          <DialogDescription>
            Mostre seu progresso para o grupo!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Emoji do Dia */}
          <div>
            <Label>Como você se sente? {moodEmoji}</Label>
            <EmojiPicker value={moodEmoji} onChange={setMoodEmoji} />
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Treino Matinal de Peito"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Como foi seu treino? (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Tipo e Duração */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Tipo de Treino *</Label>
              <Select value={workoutType} onValueChange={setWorkoutType}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="musculacao">🏋️ Musculação</SelectItem>
                  <SelectItem value="cardio">🏃 Cardio</SelectItem>
                  <SelectItem value="yoga">🧘 Yoga/Pilates</SelectItem>
                  <SelectItem value="outro">⚡ Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duração (min) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          {/* Foto */}
          <div>
            <Label>Foto do Treino</Label>
            <div className="mt-2">
              {preview ? (
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg border border-border"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80"
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
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Adicionar Foto
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Pontos */}
          <div className="p-3 bg-primary/10 rounded-lg">
            <p className="text-sm">
              <strong>Pontos:</strong>{" "}
              {duration && workoutType
                ? Math.round(
                    parseInt(duration) *
                      ({ musculacao: 3.0, cardio: 2.0, yoga: 1.5, outro: 2.0 }[
                        workoutType
                      ] || 2.0)
                  )
                : 0}{" "}
              pts
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={uploading}>
            {uploading ? "Publicando..." : "Publicar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostDialog;

