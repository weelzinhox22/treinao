import { useState } from "react";
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
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trophy, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { groupService } from "@/services/groupService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Group } from "@/services/groupService";

interface CreateChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  onChallengeCreated?: () => void;
}

const CreateChallengeDialog = ({
  open,
  onOpenChange,
  group,
  onChallengeCreated,
}: CreateChallengeDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7); // 7 dias a partir de hoje
    return date;
  });
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!user || !group || !name.trim()) return;

    if (endDate <= startDate) {
      toast({
        title: "Data inválida",
        description: "A data de término deve ser posterior à data de início.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      await groupService.createChallenge(
        group.id,
        user.id,
        user.name,
        name.trim(),
        description.trim() || undefined,
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );

      toast({
        title: "Desafio criado!",
        description: "Agora os membros do grupo podem participar",
      });

      onChallengeCreated?.();
      onOpenChange(false);
      
      // Reset form
      setName("");
      setDescription("");
      setStartDate(new Date());
      const newEndDate = new Date();
      newEndDate.setDate(newEndDate.getDate() + 7);
      setEndDate(newEndDate);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o desafio.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Criar Desafio em {group.name}
          </DialogTitle>
          <DialogDescription>
            Crie um desafio para competir com os membros do grupo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="name">Nome do Desafio</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Desafio Semanal de Musculação"
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
              placeholder="Descreva o desafio..."
              className="mt-1"
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Data de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => d && setStartDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label>Data de Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy") : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(d) => d && setEndDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
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
              "Criar Desafio"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChallengeDialog;

