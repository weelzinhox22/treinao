import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Trophy,
  Copy,
  Check,
  Loader2,
  Crown,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Target,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { groupService, type Group } from "@/services/groupService";
import { useToast } from "@/hooks/use-toast";
import GroupDialog from "./GroupDialog";

interface GroupsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GroupsManagerNew = ({ open, onOpenChange }: GroupsManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (open && user) {
      loadGroups();
    }
  }, [open, user]);

  useEffect(() => {
    if (!createGroupOpen && open && user) {
      setTimeout(() => loadGroups(), 500);
    }
  }, [createGroupOpen, open, user]);

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

  const handleJoinGroup = async () => {
    if (!inviteCode.trim() || !user) return;

    setJoiningGroup(true);
    try {
      const group = await groupService.joinGroup(inviteCode.toUpperCase(), user.id, user.name);
      
      if (group) {
        toast({
          title: "Você entrou no grupo!",
          description: `Bem-vindo ao ${group.name} 🎉`,
        });
        setInviteCode("");
        loadGroups();
      } else {
        toast({
          title: "Código inválido",
          description: "Grupo não encontrado. Verifique o código.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao entrar no grupo",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setJoiningGroup(false);
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0" aria-describedby="groups-description">
          <DialogHeader className="p-6 pb-4 bg-gradient-to-r from-primary/10 to-primary/5">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              Meus Grupos
            </DialogTitle>
            <DialogDescription id="groups-description" className="text-base">
              Gerencie seus grupos e entre em novos desafios
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[calc(90vh-140px)] px-6 pb-6">
            <Tabs defaultValue="my-groups" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="my-groups" className="gap-2">
                  <Users className="h-4 w-4" />
                  Meus Grupos ({groups.length})
                </TabsTrigger>
                <TabsTrigger value="join" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Entrar em Grupo
                </TabsTrigger>
              </TabsList>

              {/* Tab: Meus Grupos */}
              <TabsContent value="my-groups" className="space-y-6">
                {/* Botão Criar Grupo */}
                <Card className="p-6 gradient-card border-dashed border-2 border-primary/30 hover:border-primary/50 transition-colors cursor-pointer group"
                  onClick={() => setCreateGroupOpen(true)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">Criar Novo Grupo</h3>
                        <p className="text-sm text-muted-foreground">
                          Reúna amigos e crie desafios juntos
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </Card>

                {/* Lista de Grupos */}
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : groups.length === 0 ? (
                  <Card className="p-12 text-center gradient-card border-border/50">
                    <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum grupo ainda</h3>
                    <p className="text-muted-foreground mb-6">
                      Crie seu primeiro grupo ou entre em um usando o código
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button onClick={() => setCreateGroupOpen(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Criar Grupo
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groups.map((group) => (
                      <Card 
                        key={group.id}
                        className="group overflow-hidden gradient-card border-border/50 hover:shadow-glow transition-all cursor-pointer"
                        onClick={() => openGroup(group.id)}
                      >
                        {/* Header do Card */}
                        <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent relative overflow-hidden">
                          <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
                          <div className="absolute top-4 right-4">
                            {group.owner_id === user?.id && (
                              <Badge variant="default" className="gap-1 shadow-lg">
                                <Crown className="h-3 w-3" />
                                Dono
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Conteúdo */}
                        <div className="p-5 -mt-8 relative">
                          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl flex items-center justify-center mb-4 ring-4 ring-background">
                            <Users className="h-8 w-8 text-white" />
                          </div>

                          <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                            {group.name}
                          </h3>
                          
                          {group.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {group.description}
                            </p>
                          )}

                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                              <Users className="h-4 w-4 text-primary" />
                              <span className="text-sm font-semibold">
                                {group.member_count || 0} membros
                              </span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                              <TrendingUp className="h-4 w-4 text-yellow-500" />
                              <span className="text-sm font-semibold">Ativo</span>
                            </div>
                          </div>

                          {/* Código de Convite */}
                          <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                            <div className="flex items-center justify-between">
                              <div>
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
                                className="h-10 w-10 rounded-full hover:bg-primary/20"
                              >
                                {copiedCode === group.invite_code ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* Ações */}
                          <div className="mt-4 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                openGroup(group.id);
                              }}
                            >
                              <ArrowRight className="h-4 w-4" />
                              Abrir Feed
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                copyInviteCode(group.invite_code!);
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab: Entrar em Grupo */}
              <TabsContent value="join" className="space-y-6">
                <Card className="p-8 gradient-card border-border/50">
                  <div className="max-w-md mx-auto space-y-6">
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Target className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">Entrar em um Grupo</h3>
                      <p className="text-muted-foreground">
                        Digite o código de convite que você recebeu
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Input
                          placeholder="Digite o código (ex: ABC123)"
                          value={inviteCode}
                          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                          onKeyPress={(e) => e.key === "Enter" && handleJoinGroup()}
                          className="text-center text-xl font-mono tracking-wider h-14"
                          maxLength={6}
                        />
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          O código tem 6 caracteres
                        </p>
                      </div>

                      <Button
                        onClick={handleJoinGroup}
                        disabled={inviteCode.length !== 6 || joiningGroup}
                        className="w-full h-12 text-lg gap-2"
                      >
                        {joiningGroup ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Entrando...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5" />
                            Entrar no Grupo
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Info */}
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <p className="text-sm text-muted-foreground text-center">
                        💡 <strong>Dica:</strong> Peça o código de convite para o dono do grupo
                      </p>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Criar Grupo */}
      <GroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onGroupCreated={() => {
          setCreateGroupOpen(false);
          loadGroups();
        }}
      />
    </>
  );
};

export default GroupsManagerNew;

