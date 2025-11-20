import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  TrendingUp, 
  Calendar, 
  Dumbbell,
  Plus,
  Weight,
  Target,
  Trophy
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { treinoService } from "@/services/treinoService";
import { metasService, type Meta } from "@/services/metasService";
import { gamificationService } from "@/services/gamificationService";
import { fotoService } from "@/services/fotoService";
import { templatesService } from "@/services/templatesService";
import type { Treino } from "@/services/treinoService";
import BadgeNotification from "@/components/BadgeNotification";
import type { Badge } from "@/services/gamificationService";
import { StatsCardSkeleton } from "@/components/Skeleton";
import UploadAvatarDialog from "@/components/UploadAvatarDialog";
import { Camera } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTreinos: 0,
    treinosThisMonth: 0,
    treinosLastMonth: 0,
    totalVolume: 0,
    thisMonthVolume: 0,
    lastMonthVolume: 0,
    streak: 0,
  });
  const [lastLifts, setLastLifts] = useState<Array<{ exercise: string; weight: string; reps: string }>>([]);
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    if (!user) return;

    const userStats = treinoService.getStats(user.id);
    setStats(userStats);

    // Obter últimos treinos e extrair últimas cargas
    const treinos = treinoService.getTreinos(user.id);
    const sortedTreinos = [...treinos].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const lifts: Array<{ exercise: string; weight: string; reps: string }> = [];
    const seenExercises = new Set<string>();

    for (const treino of sortedTreinos) {
      for (const exercise of treino.exercises) {
        if (!seenExercises.has(exercise.name) && exercise.weight > 0) {
          lifts.push({
            exercise: exercise.name,
            weight: `${exercise.weight} kg`,
            reps: `${exercise.sets}x${exercise.reps}`,
          });
          seenExercises.add(exercise.name);
          if (lifts.length >= 4) break;
        }
      }
      if (lifts.length >= 4) break;
    }

    setLastLifts(lifts);

    // Carregar metas
    const userMetas = metasService.getMetas(user.id).slice(0, 3);
    setMetas(userMetas);

    // Calcular estatísticas adicionais para badges
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const treinosEstaSemana = treinos.filter(
      (t) => new Date(t.date) >= weekAgo
    ).length;

    const allExercises = treinos.flatMap((t) => t.exercises);
    const maxWeight = allExercises.length > 0
      ? Math.max(...allExercises.map((e) => e.weight))
      : 0;

    const fotos = fotoService.getFotos(user.id);
    const templates = templatesService.getTemplates(user.id).filter((t) => !t.isDefault);

    // Verificar e desbloquear badges
    const unlockedBadgeIds = gamificationService.checkAndUnlockBadges(user.id, {
      totalTreinos: userStats.totalTreinos,
      streak: userStats.streak,
      totalVolume: userStats.totalVolume,
      recordesBatidos: 0, // TODO: calcular recordes batidos
      metasAlcancadas: metasService.getMetas(user.id).filter((m) => m.achieved).length,
      treinosEsteMes: userStats.treinosThisMonth,
      treinosEsteAno: userStats.totalTreinos,
      treinosEstaSemana,
      maxWeight,
      fotosAdicionadas: fotos.length,
      templatesCriados: templates.length,
    });

    // Mostrar notificação de badge desbloqueado
    if (unlockedBadgeIds.length > 0) {
      const allBadges = gamificationService.getAllBadges();
      const badge = allBadges.find((b) => b.id === unlockedBadgeIds[0]);
      if (badge) {
        const unlockedBadges = gamificationService.getUnlockedBadges(user.id);
        const unlockedBadge = unlockedBadges.find((b) => b.id === badge.id);
        if (unlockedBadge) {
          setNewBadge(unlockedBadge);
        }
      }
    }

    setLoading(false);
  };

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)}kg`;
  };

  const statsCards = [
    {
      icon: Activity,
      label: "Treinos Este Mês",
      value: stats.treinosThisMonth.toString(),
      change: stats.treinosLastMonth > 0 
        ? `+${stats.treinosThisMonth - stats.treinosLastMonth} vs mês anterior`
        : "Primeiro mês",
      positive: true,
    },
    {
      icon: TrendingUp,
      label: "Volume do Mês",
      value: formatVolume(stats.thisMonthVolume * 1000),
      change: stats.lastMonthVolume > 0
        ? `+${formatVolume((stats.thisMonthVolume - stats.lastMonthVolume) * 1000)} vs mês anterior`
        : "Começando agora",
      positive: true,
    },
    {
      icon: Calendar,
      label: "Sequência",
      value: `${stats.streak} ${stats.streak === 1 ? 'dia' : 'dias'}`,
      change: stats.streak > 0 ? "Continue assim!" : "Comece hoje!",
      positive: stats.streak > 0,
    },
    {
      icon: Dumbbell,
      label: "Total de Treinos",
      value: stats.totalTreinos.toString(),
      change: "Todos os tempos",
      positive: true,
    },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-1">Olá, {user?.name?.split(' ')[0] || 'Atleta'}!</h1>
            <p className="text-muted-foreground text-sm">
              Veja seu progresso hoje
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAvatarDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden md:inline">Foto</span>
          </Button>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {statsCards.map((stat, index) => (
              <Card 
                key={index}
                className="p-4 gradient-card border-border/50 shadow-card"
              >
                <stat.icon className="h-5 w-5 text-primary mb-2" />
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-xl font-bold mb-1">{stat.value}</p>
                <p className={`text-xs ${stat.positive ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {stat.change}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Last Lifts */}
        <Card className="p-4 gradient-card border-border/50 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Últimas Cargas</h2>
            <Link to="/progressao">
              <Button variant="ghost" size="sm" className="text-xs">
                Ver gráficos
              </Button>
            </Link>
          </div>
          <div className="space-y-2">
            {lastLifts.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">
                Nenhuma carga registrada ainda. Comece a treinar!
              </p>
            ) : (
              lastLifts.map((lift, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border border-border"
                >
                  <div>
                    <p className="font-medium text-sm">{lift.exercise}</p>
                    <p className="text-xs text-muted-foreground">{lift.reps}</p>
                  </div>
                  <p className="font-bold text-primary">{lift.weight}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Badge Notification */}
      {newBadge && (
        <BadgeNotification
          badge={newBadge}
          onClose={() => setNewBadge(null)}
        />
      )}

      {/* Avatar Upload Dialog */}
      <UploadAvatarDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        onUploaded={() => {
          // Recarregar dados se necessário
        }}
      />
    </div>
  );
};

export default Dashboard;
