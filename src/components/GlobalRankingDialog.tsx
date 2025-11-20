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
import { Trophy, Flame, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { globalRankingService, type GlobalUserStats } from "@/services/globalRankingService";
import { useAuth } from "@/contexts/AuthContext";

interface GlobalRankingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const GlobalRankingDialog = ({ open, onOpenChange }: GlobalRankingDialogProps) => {
  const { user } = useAuth();
  const [topUsers, setTopUsers] = useState<GlobalUserStats[]>([]);
  const [nearbyUsers, setNearbyUsers] = useState<GlobalUserStats[]>([]);
  const [userStats, setUserStats] = useState<GlobalUserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadRanking();
    }
  }, [open]);

  const loadRanking = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Buscar top 50
      const top = await globalRankingService.getGlobalRanking(50);
      setTopUsers(top);

      // Buscar stats do usuário
      const myStats = await globalRankingService.getUserStats(user.id);
      setUserStats(myStats);

      // Buscar usuários próximos
      if (myStats) {
        const nearby = await globalRankingService.getNearbyUsers(user.id, 5);
        setNearbyUsers(nearby);
      }
    } catch (error) {
      console.error("Erro ao carregar ranking:", error);
    } finally {
      setLoading(false);
    }
  };

  const RankingCard = ({ stats, highlight = false }: { stats: GlobalUserStats; highlight?: boolean }) => {
    const level = globalRankingService.calculateLevel(stats.total_points);
    const emoji = globalRankingService.getRankEmoji(stats.global_rank);

    return (
      <div
        className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
          highlight
            ? "bg-primary/10 border-2 border-primary"
            : "bg-muted/30 hover:bg-muted/50"
        }`}
      >
        <div className="text-2xl font-bold w-12 text-center">{emoji}</div>
        
        <Avatar className="h-12 w-12">
          <AvatarImage src={stats.user_avatar_url} />
          <AvatarFallback>
            {stats.user_name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{stats.user_name}</p>
            <Badge variant="outline" className="text-xs">
              Nível {level.level}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.total_posts} posts • {stats.total_workouts} treinos • {globalRankingService.formatWorkoutTime(stats.total_workout_minutes)}
          </p>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 justify-end mb-1">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <p className="text-2xl font-bold text-yellow-500">{stats.total_points}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {stats.global_rank}º lugar
          </p>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" aria-describedby="ranking-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking Global
          </DialogTitle>
          <DialogDescription id="ranking-description">
            Veja os melhores atletas da comunidade
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            {/* Seu Progresso */}
            {userStats && (
              <div className="mb-6 p-6 rounded-lg bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/20">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Seu Progresso</h3>
                    <p className="text-sm text-muted-foreground">
                      {userStats.global_rank}º lugar no ranking global
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-yellow-500">{userStats.total_points}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">{userStats.total_posts}</p>
                    <p className="text-xs text-muted-foreground">Posts</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-500">{userStats.total_workouts}</p>
                    <p className="text-xs text-muted-foreground">Treinos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-500">{userStats.total_likes_received}</p>
                    <p className="text-xs text-muted-foreground">Curtidas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">
                      {globalRankingService.formatWorkoutTime(userStats.total_workout_minutes)}
                    </p>
                    <p className="text-xs text-muted-foreground">Tempo</p>
                  </div>
                </div>
              </div>
            )}

            <Tabs defaultValue="top" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="top">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Top 50
                </TabsTrigger>
                <TabsTrigger value="nearby">
                  <Flame className="h-4 w-4 mr-2" />
                  Próximos a Você
                </TabsTrigger>
              </TabsList>

              <TabsContent value="top" className="space-y-2 mt-4">
                {topUsers.map((stats) => (
                  <RankingCard
                    key={stats.user_id}
                    stats={stats}
                    highlight={stats.user_id === user?.id}
                  />
                ))}
              </TabsContent>

              <TabsContent value="nearby" className="space-y-2 mt-4">
                {nearbyUsers.length > 0 ? (
                  nearbyUsers.map((stats) => (
                    <RankingCard
                      key={stats.user_id}
                      stats={stats}
                      highlight={stats.user_id === user?.id}
                    />
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Comece a treinar para aparecer no ranking!
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GlobalRankingDialog;

