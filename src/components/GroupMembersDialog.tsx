import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Trophy } from "lucide-react";
import { groupService } from "@/services/groupService";
import { groupRankingService, type MemberStats } from "@/services/groupRankingService";

interface GroupMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

const GroupMembersDialog = ({ open, onOpenChange, groupId, groupName }: GroupMembersDialogProps) => {
  const [members, setMembers] = useState<any[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && groupId) {
      loadMembers();
    }
  }, [open, groupId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      
      // Buscar membros do grupo
      const groupMembers = await groupService.getGroupMembers(groupId);
      setMembers(groupMembers);

      // Buscar estatísticas dos membros
      const stats = await groupRankingService.getGroupRanking(groupId);
      setMemberStats(stats);
    } catch (error) {
      console.error("Erro ao carregar membros:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMemberStats = (userId: string) => {
    return memberStats.find((s) => s.user_id === userId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" aria-describedby="members-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Membros de {groupName}
          </DialogTitle>
          <DialogDescription id="members-description">
            {members.length} {members.length === 1 ? "membro" : "membros"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const stats = getMemberStats(member.user_id);
              
              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.user_avatar_url} />
                    <AvatarFallback>
                      {member.user_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{member.user_name}</p>
                      {member.role === "owner" && (
                        <Badge variant="default" className="gap-1">
                          <Crown className="h-3 w-3" />
                          Dono
                        </Badge>
                      )}
                      {stats?.is_top_contributor && (
                        <Badge variant="secondary" className="gap-1">
                          <Trophy className="h-3 w-3" />
                          Top
                        </Badge>
                      )}
                    </div>
                    
                    {stats && (
                      <p className="text-sm text-muted-foreground">
                        {stats.rank}º lugar • {stats.total_points} pontos • {stats.posts_count} posts
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Entrou em {new Date(member.joined_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>

                  {stats && (
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-500">{stats.rank}º</p>
                      <p className="text-xs text-muted-foreground">{stats.total_points} pts</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupMembersDialog;
