import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2, Globe, Lock, UserX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { socialService } from "@/services/socialService";
import { useToast } from "@/hooks/use-toast";
import type { Treino } from "@/services/treinoService";
import { useNavigate } from "react-router-dom";

interface ShareTreinoDialogProps {
  treino: Treino;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShared?: () => void;
}

const ShareTreinoDialog = ({
  treino,
  open,
  onOpenChange,
  onShared,
}: ShareTreinoDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPublic, setIsPublic] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [tags, setTags] = useState("");
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!user) return;

    setSharing(true);

    try {
      const tagArray = tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      await socialService.shareTreino(
        treino.id,
        user.id,
        user.name,
        {
          name: treino.name,
          exercises: treino.exercises.map((e) => ({
            name: e.name,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
          })),
          totalVolume: treino.totalVolume,
          date: treino.date,
        },
        {
          isPublic,
          isAnonymous,
          tags: tagArray,
        }
      );

      toast({
        title: "Treino compartilhado!",
        description: isPublic
          ? "Seu treino está visível no feed da comunidade"
          : "Seu treino foi compartilhado de forma privada",
      });

      onShared?.();
      onOpenChange(false);
      
      if (isPublic) {
        setTimeout(() => navigate("/feed"), 500);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível compartilhar o treino.",
        variant: "destructive",
      });
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar Treino
          </DialogTitle>
          <DialogDescription>
            Compartilhe "{treino.name}" com a comunidade
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Visibilidade */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isPublic ? (
                <Globe className="h-4 w-4 text-primary" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="public">Público</Label>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            {isPublic
              ? "Qualquer pessoa pode ver este treino no feed"
              : "Apenas você pode ver este treino"}
          </p>

          {/* Anônimo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="anonymous">Compartilhar anonimamente</Label>
            </div>
            <Switch
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>
          <p className="text-xs text-muted-foreground ml-6">
            {isAnonymous
              ? "Seu nome não será exibido"
              : "Seu nome será exibido no compartilhamento"}
          </p>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
            <Input
              id="tags"
              placeholder="ex: peito, força, supino"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Adicione tags para facilitar a busca
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleShare} disabled={sharing}>
            {sharing ? "Compartilhando..." : "Compartilhar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTreinoDialog;

