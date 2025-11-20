import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { groupService } from "@/services/groupService";
import { useToast } from "@/hooks/use-toast";

interface GroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGroupCreated?: () => void;
}

const GroupDialog = ({ open, onOpenChange, onGroupCreated }: GroupDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!user || !name.trim()) return;

    setCreating(true);
    try {
      const group = await groupService.createGroup(
        user.id,
        user.name,
        name.trim(),
        description.trim() || undefined,
        isPublic
      );

      toast({
        title: "Grupo criado!",
        description: `Código de convite: ${group.invite_code}`,
      });

      // Chamar callback antes de fechar para garantir que os dados sejam recarregados
      if (onGroupCreated) {
        await onGroupCreated();
      }
      
      // Pequeno delay para garantir que o grupo foi processado
      await new Promise(resolve => setTimeout(resolve, 200));
      
      onOpenChange(false);
      
      // Reset form
      setName("");
      setDescription("");
      setIsPublic(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o grupo.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Criar Novo Grupo
          </DialogTitle>
          <DialogDescription>
            Crie um grupo para competir com seus amigos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Nome do Grupo</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Academia do Bairro"
              className="mt-1"
              maxLength={50}
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva seu grupo..."
              className="mt-1"
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="public">Grupo Público</Label>
              <p className="text-xs text-muted-foreground">
                Qualquer pessoa pode entrar com o código
              </p>
            </div>
            <Switch
              id="public"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || creating}>
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : (
              "Criar Grupo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GroupDialog;

