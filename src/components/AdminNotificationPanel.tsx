import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, MessageSquare, AlertCircle, Shield, Bell } from "lucide-react";
import { notificationService } from "@/services/notificationService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const AdminNotificationPanel = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'admin' | 'workout_reminder' | 'challenge' | 'ranking'>('admin');
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  // Verificar se é admin
  const isAdmin = user?.email === 'weelzinhox22@gmail.com' || user?.email?.includes('@admin.');

  if (!isAdmin) return null;

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha título e mensagem",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const count = await notificationService.sendToAll(
        type,
        title,
        message,
        { sent_at: new Date().toISOString() }
      );

      toast({
        title: "Notificação enviada!",
        description: `Enviada para ${count} usuários`,
      });

      setTitle("");
      setMessage("");
      setOpen(false);
    } catch (error: any) {
      toast({
        title: "Erro ao enviar",
        description: error.message || "Não foi possível enviar a notificação",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Send className="h-4 w-4" />
          Enviar Notificação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Painel Administrativo
            <Badge variant="default" className="ml-auto">Admin</Badge>
          </DialogTitle>
          <DialogDescription>
            Envie uma notificação para todos os usuários da plataforma
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="type">Tipo de Notificação</Label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">📢 Anúncio Geral</SelectItem>
                <SelectItem value="workout_reminder">⏰ Lembrete de Treino</SelectItem>
                <SelectItem value="challenge">🏆 Novo Desafio</SelectItem>
                <SelectItem value="ranking">🏅 Atualização de Ranking</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Novo Desafio Semanal!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2"
              maxLength={100}
            />
          </div>

          <div>
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              placeholder="Ex: Participe do novo desafio e ganhe pontos extras!"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-2 min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length}/500 caracteres
            </p>
          </div>

          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                <strong>Atenção:</strong> Esta notificação será enviada para TODOS os usuários da plataforma. 
                Use com responsabilidade.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={sending || !title.trim() || !message.trim()}>
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Enviar para Todos
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminNotificationPanel;

