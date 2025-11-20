import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trophy, Medal, Award, Loader2 } from "lucide-react";
import { groupService, type GroupMember } from "@/services/groupService";
import ProfileAvatar from "./ProfileAvatar";
import { cn } from "@/lib/utils";

interface GroupRankingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  groupName: string;
}

const GroupRankingDialog = ({
  open,
  onOpenChange,
  groupId,
  groupName,
}: GroupRankingDialogProps) => {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && groupId) {
      loadRanking();
    }
  }, [open, groupId]);

  const loadRanking = async () => {
    setLoading(true);
    try {
      const ranking = await groupService.getGroupLeaderboard(groupId);
      setMembers(ranking);
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-orange-500" />;
    return <span className="text-muted-foreground font-bold">#{rank}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Ranking - {groupName}
          </DialogTitle>
          <DialogDescription>
            Classificação dos membros por pontuação total
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
              <Card
                key={member.id}
                className={cn(
                  "p-4 gradient-card border-border/50",
                  member.rank === 1 && "border-yellow-500/50 bg-yellow-500/5",
                  member.rank === 2 && "border-gray-400/50 bg-gray-400/5",
                  member.rank === 3 && "border-orange-500/50 bg-orange-500/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-10">
                      {getRankIcon(member.rank || 0)}
                    </div>
                    <ProfileAvatar
                      userId={member.user_id}
                      userName={member.user_name}
                      size="md"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{member.user_name}</p>
                      {member.role === "owner" && (
                        <p className="text-xs text-primary">Dono do Grupo</p>
                      )}
                      {member.role === "admin" && (
                        <p className="text-xs text-muted-foreground">Admin</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-primary" />
                    <span className="font-bold text-lg text-primary">
                      {member.total_points || 0} pts
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GroupRankingDialog;

