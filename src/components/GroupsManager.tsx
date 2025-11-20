import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Trophy,
  Calendar,
  Copy,
  Check,
  Loader2,
  Trash2,
  UserMinus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { groupService, type Group, type Challenge } from "@/services/groupService";
import { useToast } from "@/hooks/use-toast";
import GroupDialog from "./GroupDialog";
import CreateChallengeDialog from "./CreateChallengeDialog";
import GroupRankingDialog from "./GroupRankingDialog";
import GroupMembersDialog from "./GroupMembersDialog";
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
import { format } from "date-fns";

interface GroupsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GroupsManager = ({ open, onOpenChange }: GroupsManagerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [createChallengeOpen, setCreateChallengeOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [rankingDialogOpen, setRankingDialogOpen] = useState(false);
  const [selectedGroupForRanking, setSelectedGroupForRanking] = useState<Group | null>(null);
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false);
  const [deleteChallengeDialogOpen, setDeleteChallengeDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
  const [challengeToDelete, setChallengeToDelete] = useState<Challenge | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [selectedGroupForMembers, setSelectedGroupForMembers] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [deletingChallenge, setDeletingChallenge] = useState(false);

  useEffect(() => {
    if (open && user) {
      loadData();
    }
  }, [open, user]);

  // Recarregar quando o dialog de criar grupo fechar
  useEffect(() => {
    if (!createGroupOpen && open && user) {
      // Pequeno delay para garantir que o grupo foi salvo
      const timer = setTimeout(() => {
        loadData();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [createGroupOpen, open, user]);

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userGroups = await groupService.getGroups(user.id);
      setGroups(userGroups);

      // Carregar desafios de todos os grupos
      const allChallenges: Challenge[] = [];
      for (const group of userGroups) {
        const groupChallenges = await groupService.getChallenges(group.id);
        allChallenges.push(...groupChallenges);
      }
      setChallenges(allChallenges);
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user || !inviteCode.trim()) return;

    try {
      const group = await groupService.joinGroupByCode(inviteCode.trim(), user.id, user.name);
      if (group) {
        toast({
          title: "Grupo encontrado!",
          description: `Você entrou no grupo "${group.name}"`,
        });
        setInviteCode("");
        loadData();
      } else {
        toast({
          title: "Código inválido",
          description: "Não foi possível encontrar um grupo com este código.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível entrar no grupo.",
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Código copiado!",
      description: "Compartilhe este código com seus amigos",
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Meus Grupos e Desafios
            </DialogTitle>
            <DialogDescription>
              Gerencie seus grupos e participe de desafios
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Criar/Entrar em Grupo */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={() => setCreateGroupOpen(true)}
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Grupo
              </Button>
              <div className="flex gap-2 flex-1">
                <Input
                  placeholder="Código de convite"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleJoinGroup();
                  }}
                  maxLength={8}
                />
                <Button onClick={handleJoinGroup} disabled={!inviteCode.trim()}>
                  Entrar
                </Button>
              </div>
            </div>

            {/* Lista de Grupos */}
            <div>
              <h3 className="font-semibold mb-3">Meus Grupos ({groups.length})</h3>
              {groups.length === 0 ? (
                <Card className="p-8 text-center border-border/50">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Você ainda não está em nenhum grupo
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <Card key={group.id} className="p-4 gradient-card border-border/50">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold">{group.name}</h4>
                              {group.owner_id === user?.id && (
                                <Badge variant="default" className="text-xs">
                                  Dono
                                </Badge>
                              )}
                            </div>
                            {group.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {group.description}
                              </p>
                            )}
                            {group.invite_code && (
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-xs text-muted-foreground">Código:</span>
                                <code className="text-xs font-mono bg-background px-2 py-1 rounded break-all">
                                  {group.invite_code}
                                </code>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 flex-shrink-0"
                                  onClick={() => copyInviteCode(group.invite_code!)}
                                >
                                  {copiedCode === group.invite_code ? (
                                    <Check className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedGroupForRanking(group);
                              setRankingDialogOpen(true);
                            }}
                            className="text-xs"
                          >
                            <Trophy className="h-3 w-3 mr-1" />
                            Ranking
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedGroupForMembers(group);
                              setMembersDialogOpen(true);
                            }}
                            className="text-xs"
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Membros
                          </Button>
                          {group.owner_id === user?.id && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedGroup(group);
                                  setCreateChallengeOpen(true);
                                }}
                                className="text-xs"
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Criar Desafio
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setGroupToDelete(group);
                                  setDeleteGroupDialogOpen(true);
                                }}
                                className="text-xs"
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Excluir
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Desafios Ativos */}
            <div>
              <h3 className="font-semibold mb-3">
                Desafios Ativos ({challenges.filter((c) => c.is_active).length})
              </h3>
              {challenges.filter((c) => c.is_active).length === 0 ? (
                <Card className="p-8 text-center border-border/50">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum desafio ativo no momento
                  </p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {challenges
                    .filter((c) => c.is_active)
                    .map((challenge) => (
                      <Card key={challenge.id} className="p-4 gradient-card border-border/50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Trophy className="h-4 w-4 text-primary" />
                              <h4 className="font-bold">{challenge.name}</h4>
                            </div>
                            {challenge.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {challenge.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {format(new Date(challenge.start_date), "dd/MM")} -{" "}
                                  {format(new Date(challenge.end_date), "dd/MM/yyyy")}
                                </span>
                              </div>
                              {challenge.participant_count !== undefined && (
                                <span>{challenge.participant_count} participantes</span>
                              )}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              if (!user) return;
                              try {
                                await groupService.joinChallenge(
                                  challenge.id,
                                  user.id,
                                  user.name
                                );
                                toast({
                                  title: "Desafio aceito!",
                                  description: "Agora você está participando deste desafio",
                                });
                                loadData();
                              } catch (error: any) {
                                toast({
                                  title: "Erro",
                                  description: error.message || "Não foi possível entrar no desafio.",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            Participar
                          </Button>
                        </div>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <GroupDialog
        open={createGroupOpen}
        onOpenChange={(open) => {
          setCreateGroupOpen(open);
          if (!open) {
            // Recarregar dados quando fechar o dialog
            setTimeout(() => loadData(), 100);
          }
        }}
        onGroupCreated={async () => {
          // Aguardar um pouco para garantir que o grupo foi salvo
          await new Promise(resolve => setTimeout(resolve, 300));
          await loadData();
        }}
      />

      <CreateChallengeDialog
        open={createChallengeOpen}
        onOpenChange={setCreateChallengeOpen}
        group={selectedGroup}
        onChallengeCreated={() => {
          loadData();
        }}
      />

      <GroupRankingDialog
        open={rankingDialogOpen}
        onOpenChange={setRankingDialogOpen}
        groupId={selectedGroupForRanking?.id || ""}
        groupName={selectedGroupForRanking?.name || ""}
      />

      <GroupMembersDialog
        open={membersDialogOpen}
        onOpenChange={setMembersDialogOpen}
        group={selectedGroupForMembers}
        onMemberRemoved={() => {
          loadData();
        }}
      />

      {/* Dialog de confirmação para excluir grupo */}
      <AlertDialog open={deleteGroupDialogOpen} onOpenChange={setDeleteGroupDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o grupo "{groupToDelete?.name}"? Esta ação não pode ser desfeita e todos os desafios e dados do grupo serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingGroup}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!groupToDelete || !user) return;
                setDeletingGroup(true);
                try {
                  await groupService.deleteGroup(groupToDelete.id, user.id);
                  toast({
                    title: "Grupo excluído",
                    description: "O grupo foi excluído com sucesso",
                  });
                  setDeleteGroupDialogOpen(false);
                  setGroupToDelete(null);
                  loadData();
                } catch (error: any) {
                  toast({
                    title: "Erro",
                    description: error.message || "Não foi possível excluir o grupo.",
                    variant: "destructive",
                  });
                } finally {
                  setDeletingGroup(false);
                }
              }}
              disabled={deletingGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingGroup ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmação para excluir desafio */}
      <AlertDialog open={deleteChallengeDialogOpen} onOpenChange={setDeleteChallengeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Desafio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o desafio "{challengeToDelete?.name}"? Esta ação não pode ser desfeita e todos os dados do desafio serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingChallenge}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!challengeToDelete || !user) return;
                setDeletingChallenge(true);
                try {
                  await groupService.deleteChallenge(challengeToDelete.id, user.id);
                  toast({
                    title: "Desafio excluído",
                    description: "O desafio foi excluído com sucesso",
                  });
                  setDeleteChallengeDialogOpen(false);
                  setChallengeToDelete(null);
                  loadData();
                } catch (error: any) {
                  toast({
                    title: "Erro",
                    description: error.message || "Não foi possível excluir o desafio.",
                    variant: "destructive",
                  });
                } finally {
                  setDeletingChallenge(false);
                }
              }}
              disabled={deletingChallenge}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingChallenge ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GroupsManager;

