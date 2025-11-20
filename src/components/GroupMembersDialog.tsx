import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Users, UserMinus, Loader2, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { groupService, type GroupMember, type Group } from "@/services/groupService";
import { useToast } from "@/hooks/use-toast";
import ProfileAvatar from "./ProfileAvatar";

interface GroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  onMemberRemoved?: () => void;
}

const GroupMembersDialog = ({
  open,
  onOpenChange,
  group,
  onMemberRemoved,
}: GroupMembersDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (open && group) {
      loadMembers();
    }
  }, [open, group]);

  const loadMembers = async () => {
    if (!group) return;

    setLoading(true);
    try {
      const groupMembers = await groupService.getGroupMembers(group.id);
      setMembers(groupMembers);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!group || !memberToRemove || !user) return;

    setRemoving(true);
    try {
      await groupService.removeMember(group.id, memberToRemove.user_id, user.id);
      toast({
        title: "Membro removido",
        description: `${memberToRemove.user_name} foi removido do grupo`,
      });
      setMemberToRemove(null);
      loadMembers();
      onMemberRemoved?.();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível remover o membro.",
        variant: "destructive",
      });
    } finally {
      setRemoving(false);
    }
  };

  const isOwner = group?.owner_id === user?.id;
  const isAdmin = isOwner || members.some(m => m.user_id === user?.id && m.role === "admin");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membros do Grupo - {group?.name}
            </DialogTitle>
            <DialogDescription>
              {isOwner ? "Gerencie os membros do seu grupo" : "Lista de membros do grupo"}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum membro no grupo ainda
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {members.map((member) => (
                <Card key={member.id} className="p-4 gradient-card border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <ProfileAvatar
                        userId={member.user_id}
                        userName={member.user_name}
                        size="md"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold">{member.user_name}</p>
                          {member.role === "owner" && (
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                              Dono
                            </span>
                          )}
                          {member.role === "admin" && (
                            <span className="text-xs px-2 py-0.5 rounded bg-secondary/20 text-secondary-foreground">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Trophy className="h-3 w-3 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            {member.total_points || 0} pontos
                          </span>
                        </div>
                      </div>
                    </div>
                    {isOwner && member.role !== "owner" && member.user_id !== user?.id && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setMemberToRemove(member)}
                        disabled={removing}
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Membro</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {memberToRemove?.user_name} do grupo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing ? "Removendo..." : "Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default GroupMembersDialog;

