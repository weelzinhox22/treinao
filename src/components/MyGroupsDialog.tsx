import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  ArrowRight,
  Crown,
  Copy,
  Check,
  Loader2,
  TrendingUp,
  Flame,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { groupService, type Group } from "@/services/groupService";
import { useToast } from "@/hooks/use-toast";

interface MyGroupsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenGroupsManager?: () => void;
}

const MyGroupsDialog = ({ open, onOpenChange, onOpenGroupsManager }: MyGroupsDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      loadGroups();
    }
  }, [open, user]);

  const loadGroups = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userGroups = await groupService.getGroups(user.id);
      setGroups(userGroups);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Código copiado!",
      description: "Compartilhe com seus amigos",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openGroup = (groupId: string) => {
    onOpenChange(false);
    navigate(`/grupo/${groupId}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden p-0" aria-describedby="my-groups-description">
        <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ring-2 ring-primary/30">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Meus Grupos
            </span>
            <Badge variant="secondary" className="ml-auto">
              {groups.length} {groups.length === 1 ? "grupo" : "grupos"}
            </Badge>
          </DialogTitle>
          <DialogDescription id="my-groups-description" className="text-base mt-2">
            Seus grupos de treino e desafios
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(85vh-140px)] px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : groups.length === 0 ? (
            <Card className="p-12 text-center gradient-card border-border/50">
              <Users className="h-20 w-20 mx-auto mb-6 text-muted-foreground opacity-50" />
              <h3 className="text-2xl font-semibold mb-3">Nenhum grupo ainda</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Você ainda não faz parte de nenhum grupo. Crie um novo grupo ou entre em um usando o código de convite!
              </p>
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  if (onOpenGroupsManager) {
                    setTimeout(() => onOpenGroupsManager(), 300);
                  }
                }}
                className="gap-2"
                size="lg"
              >
                <Users className="h-5 w-5" />
                Criar ou Entrar em Grupo
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {groups.map((group) => (
                <Card
                  key={group.id}
                  className="group overflow-hidden gradient-card border-border/50 hover:border-primary/30 hover:shadow-glow transition-all cursor-pointer relative"
                  onClick={() => openGroup(group.id)}
                >
                  {/* Header com gradiente */}
                  <div className="h-28 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                    <div className="absolute top-3 right-3">
                      {group.owner_id === user?.id && (
                        <Badge variant="default" className="gap-1 shadow-lg">
                          <Crown className="h-3 w-3" />
                          Dono
                        </Badge>
                      )}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl flex items-center justify-center ring-4 ring-background">
                        <Users className="h-7 w-7 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-5 pt-8">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                      {group.name}
                    </h3>

                    {group.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {group.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">
                          {group.member_count || 0} membros
                        </span>
                      </div>
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-semibold">Ativo</span>
                      </div>
                    </div>

                    {/* Código de Convite */}
                    <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 mb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">Código de Convite</p>
                          <p className="font-mono font-bold text-lg tracking-wider">
                            {group.invite_code}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyInviteCode(group.invite_code!);
                          }}
                          className="h-9 w-9 rounded-full hover:bg-primary/20"
                        >
                          {copiedCode === group.invite_code ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Botão Abrir */}
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        openGroup(group.id);
                      }}
                    >
                      <ArrowRight className="h-4 w-4" />
                      Abrir Feed do Grupo
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MyGroupsDialog;

