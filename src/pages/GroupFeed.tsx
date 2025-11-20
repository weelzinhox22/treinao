import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Users, Trophy, TrendingUp, Crown, Flame, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { groupService } from "@/services/groupService";
import { groupPostsService, type GroupPost } from "@/services/groupPostsService";
import { groupRankingService, type GroupStats, type MemberStats } from "@/services/groupRankingService";
import GroupPostCard from "@/components/GroupPostCard";
import CreatePostDialog from "@/components/CreatePostDialog";
import GroupMembersDialog from "@/components/GroupMembersDialog";

const GroupFeed = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [group, setGroup] = useState<any>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [groupStats, setGroupStats] = useState<GroupStats | null>(null);
  const [topMembers, setTopMembers] = useState<MemberStats[]>([]);
  const [userStats, setUserStats] = useState<MemberStats | null>(null);
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);

  useEffect(() => {
    if (groupId && user) {
      loadGroupData();
    }
  }, [groupId, user]);

  const loadGroupData = async () => {
    if (!groupId || !user) return;

    try {
      // Buscar dados do grupo
      const groups = await groupService.getGroups(user.id);
      const currentGroup = groups.find((g) => g.id === groupId);
      
      if (!currentGroup) {
        toast({
          title: "Grupo não encontrado",
          description: "Você não tem acesso a este grupo.",
          variant: "destructive",
        });
        navigate("/feed");
        return;
      }

      setGroup(currentGroup);

      // Buscar posts do grupo
      const groupPosts = await groupPostsService.getGroupPosts(groupId, user.id);
      setPosts(groupPosts);

      // Buscar estatísticas do grupo
      const stats = await groupRankingService.getGroupStats(groupId);
      setGroupStats(stats);

      // Buscar top 3 membros
      const top = await groupRankingService.getTopMembers(groupId, 3);
      setTopMembers(top);

      // Buscar stats do usuário atual
      const myStats = await groupRankingService.getMemberStats(groupId, user.id);
      setUserStats(myStats);
    } catch (error) {
      console.error("Erro ao carregar grupo:", error);
      toast({
        title: "Erro ao carregar grupo",
        description: "Não foi possível carregar os dados do grupo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = async () => {
    setCreateDialogOpen(false);
    await loadGroupData();
    toast({
      title: "Post publicado!",
      description: "Seu treino foi compartilhado com o grupo.",
    });
  };

  const handlePostDeleted = async (postId: string) => {
    setPosts(posts.filter((p) => p.id !== postId));
    toast({
      title: "Post deletado",
      description: "O post foi removido.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/feed")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </div>

        {/* Info do Grupo */}
        <Card className="p-6 gradient-card border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
              {group.description && (
                <p className="text-muted-foreground mb-4">{group.description}</p>
              )}
              
              <div className="flex flex-wrap gap-4 text-sm">
                <button
                  onClick={() => setMembersDialogOpen(true)}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <Users className="h-4 w-4 text-primary" />
                  <span>{groupStats?.member_count || 0} membros</span>
                </button>
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Código: <strong>{group.inviteCode}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span><strong>{groupStats?.total_points || 0}</strong> pontos</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Novo Post
            </Button>
          </div>
        </Card>

        {/* Seu Progresso no Grupo */}
        {userStats && (
          <Card className="p-6 gradient-card border-border/50 border-primary/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Seu Progresso</h3>
                <p className="text-sm text-muted-foreground">
                  {userStats.rank}º lugar no ranking
                </p>
              </div>
              <div className="flex gap-2">
                {userStats.is_top_contributor && (
                  <Badge variant="default" className="gap-1">
                    <Crown className="h-3 w-3" />
                    Top
                  </Badge>
                )}
                {userStats.is_most_consistent && (
                  <Badge variant="secondary" className="gap-1">
                    <Target className="h-3 w-3" />
                    Consistente
                  </Badge>
                )}
                {userStats.is_motivation_master && (
                  <Badge variant="outline" className="gap-1">
                    <Flame className="h-3 w-3" />
                    Motivador
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-500">{userStats.total_points}</p>
                <p className="text-xs text-muted-foreground">Pontos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{userStats.posts_count}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{userStats.likes_received}</p>
                <p className="text-xs text-muted-foreground">Curtidas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-500">{userStats.comments_made}</p>
                <p className="text-xs text-muted-foreground">Comentários</p>
              </div>
            </div>
          </Card>
        )}

        {/* Top 3 Ranking */}
        {topMembers.length > 0 && (
          <Card className="p-6 gradient-card border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top 3 do Grupo
              </h3>
            </div>

            <div className="space-y-3">
              {topMembers.map((member, idx) => (
                <div
                  key={member.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    idx === 0
                      ? "bg-yellow-500/10 border border-yellow-500/20"
                      : idx === 1
                      ? "bg-gray-400/10 border border-gray-400/20"
                      : "bg-orange-500/10 border border-orange-500/20"
                  }`}
                >
                  <div className="text-2xl font-bold w-8 text-center">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.user_avatar_url} />
                    <AvatarFallback>
                      {member.user_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{member.user_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {member.posts_count} posts • {member.total_workout_minutes} min
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-yellow-500">{member.total_points}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Feed de Posts */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <Card className="p-12 text-center gradient-card border-border/50">
              <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nenhum post ainda</h3>
              <p className="text-muted-foreground mb-6">
                Seja o primeiro a compartilhar um treino!
              </p>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Primeiro Post
              </Button>
            </Card>
          ) : (
            posts.map((post) => (
              <GroupPostCard
                key={post.id}
                post={post}
                currentUserId={user?.id || ""}
                currentUserName={user?.name || ""}
                onDelete={handlePostDeleted}
              />
            ))
          )}
        </div>

        {/* Dialog Criar Post */}
        <CreatePostDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          groupId={groupId!}
          userId={user?.id || ""}
          userName={user?.name || ""}
          userAvatarUrl={user?.avatar_url}
          onPostCreated={handlePostCreated}
        />

        {/* Dialog Membros */}
        <GroupMembersDialog
          open={membersDialogOpen}
          onOpenChange={setMembersDialogOpen}
          groupId={groupId!}
          groupName={group.name}
        />
      </div>
    </div>
  );
};

export default GroupFeed;

