import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Award, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { treinoService } from "@/services/treinoService";
import type { Treino } from "@/services/treinoService";
import Confetti from "@/components/Confetti";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const ExercicioDetalhes = () => {
  const { exerciseName } = useParams<{ exerciseName: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<Array<{
    date: string;
    peso: number;
    reps: number;
    sets: number;
    volume: number;
    treinoId: string;
    treinoName: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState({
    maxWeight: 0,
    maxVolume: 0,
    maxReps: 0,
    totalTreinos: 0,
    avgWeight: 0,
    avgVolume: 0,
    avgReps: 0,
    minWeight: 0,
    recentImprovement: 0, // % de melhoria no último mês
  });
  const [showConfetti, setShowConfetti] = useState(false);
  const [previousRecords, setPreviousRecords] = useState({
    maxWeight: 0,
    maxVolume: 0,
    maxReps: 0,
  });

  useEffect(() => {
    if (user && exerciseName) {
      loadHistory();
    }
  }, [user, exerciseName]);

  const loadHistory = () => {
    if (!user || !exerciseName) return;

    const treinos = treinoService.getTreinos(user.id);
    const exerciseHistory: typeof history = [];

    treinos.forEach((treino) => {
      treino.exercises.forEach((ex) => {
        if (ex.name.toLowerCase() === decodeURIComponent(exerciseName).toLowerCase()) {
          exerciseHistory.push({
            date: treino.date,
            peso: ex.weight,
            reps: ex.reps,
            sets: ex.sets,
            volume: ex.sets * ex.reps * ex.weight,
            treinoId: treino.id,
            treinoName: treino.name,
          });
        }
      });
    });

    // Ordenar por data
    exerciseHistory.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setHistory(exerciseHistory);

    // Calcular recordes e estatísticas
    if (exerciseHistory.length > 0) {
      const weights = exerciseHistory.map((h) => h.peso);
      const volumes = exerciseHistory.map((h) => h.volume);
      const reps = exerciseHistory.map((h) => h.reps);

      const maxWeight = Math.max(...weights);
      const maxVolume = Math.max(...volumes);
      const maxReps = Math.max(...reps);
      const minWeight = Math.min(...weights.filter(w => w > 0));

      const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
      const avgReps = reps.reduce((a, b) => a + b, 0) / reps.length;

      // Calcular melhoria recente (último mês vs mês anterior)
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const recentHistory = exerciseHistory.filter(h => new Date(h.date) >= oneMonthAgo);
      const previousHistory = exerciseHistory.filter(
        h => new Date(h.date) >= twoMonthsAgo && new Date(h.date) < oneMonthAgo
      );

      let recentImprovement = 0;
      if (recentHistory.length > 0 && previousHistory.length > 0) {
        const recentAvg = recentHistory.reduce((a, b) => a + b.peso, 0) / recentHistory.length;
        const previousAvg = previousHistory.reduce((a, b) => a + b.peso, 0) / previousHistory.length;
        if (previousAvg > 0) {
          recentImprovement = ((recentAvg - previousAvg) / previousAvg) * 100;
        }
      }

      const newRecords = {
        maxWeight,
        maxVolume,
        maxReps,
        totalTreinos: exerciseHistory.length,
        avgWeight: Math.round(avgWeight * 10) / 10,
        avgVolume: Math.round(avgVolume),
        avgReps: Math.round(avgReps * 10) / 10,
        minWeight: minWeight || 0,
        recentImprovement: Math.round(recentImprovement * 10) / 10,
      };

      // Verificar se bateu recorde
      if (
        previousRecords.maxWeight > 0 &&
        (newRecords.maxWeight > previousRecords.maxWeight ||
          newRecords.maxVolume > previousRecords.maxVolume ||
          newRecords.maxReps > previousRecords.maxReps)
      ) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      setPreviousRecords({
        maxWeight: newRecords.maxWeight,
        maxVolume: newRecords.maxVolume,
        maxReps: newRecords.maxReps,
      });

      setRecords(newRecords);
    }

    setLoading(false);
  };

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)}kg`;
  };

  const chartData = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString("pt-BR", { month: "short", day: "numeric" }),
    peso: h.peso,
    reps: h.reps,
    volume: h.volume / 1000, // em toneladas para o gráfico
  }));

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground text-sm">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  const decodedName = exerciseName ? decodeURIComponent(exerciseName) : "Exercício";

  if (history.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/progressao")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{decodedName}</h1>
              <p className="text-muted-foreground text-sm">Histórico do exercício</p>
            </div>
          </div>

          <Card className="p-8 gradient-card border-border/50 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Nenhum registro encontrado</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Este exercício ainda não foi registrado em nenhum treino
            </p>
            <Link to="/treinos/novo">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Registrar Primeiro Treino
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <Confetti trigger={showConfetti} />
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/progressao")}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{decodedName}</h1>
            <p className="text-muted-foreground text-sm">
              {records.totalTreinos} {records.totalTreinos === 1 ? "registro" : "registros"}
            </p>
          </div>
        </div>

        {/* Recordes e Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 gradient-card border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Maior Peso</p>
            </div>
            <p className="text-xl font-bold text-primary">{records.maxWeight}kg</p>
            {records.minWeight > 0 && (
              <p className="text-xs text-muted-foreground mt-1">Mín: {records.minWeight}kg</p>
            )}
          </Card>
          <Card className="p-4 gradient-card border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Maior Volume</p>
            </div>
            <p className="text-xl font-bold text-primary">{formatVolume(records.maxVolume)}</p>
            <p className="text-xs text-muted-foreground mt-1">Média: {formatVolume(records.avgVolume)}</p>
          </Card>
          <Card className="p-4 gradient-card border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Mais Reps</p>
            </div>
            <p className="text-xl font-bold text-primary">{records.maxReps}</p>
            <p className="text-xs text-muted-foreground mt-1">Média: {records.avgReps}</p>
          </Card>
          <Card className="p-4 gradient-card border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <p className="text-xl font-bold text-primary">{records.totalTreinos}</p>
            {records.recentImprovement !== 0 && (
              <p className={`text-xs mt-1 ${records.recentImprovement > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {records.recentImprovement > 0 ? '↑' : '↓'} {Math.abs(records.recentImprovement)}%
              </p>
            )}
          </Card>
        </div>

        {/* Estatísticas Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="p-4 gradient-card border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Peso Médio</p>
            <p className="text-lg font-bold">{records.avgWeight}kg</p>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado em {records.totalTreinos} {records.totalTreinos === 1 ? 'treino' : 'treinos'}
            </p>
          </Card>
          <Card className="p-4 gradient-card border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Volume Médio</p>
            <p className="text-lg font-bold">{formatVolume(records.avgVolume)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Por treino
            </p>
          </Card>
          <Card className="p-4 gradient-card border-border/50">
            <p className="text-xs text-muted-foreground mb-1">Progresso Recente</p>
            <p className={`text-lg font-bold ${records.recentImprovement > 0 ? 'text-green-500' : records.recentImprovement < 0 ? 'text-red-500' : ''}`}>
              {records.recentImprovement > 0 ? '+' : ''}{records.recentImprovement}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Último mês vs anterior
            </p>
          </Card>
        </div>

        {/* Gráfico de Peso */}
        <Card className="p-4 gradient-card border-border/50 shadow-card">
          <h2 className="text-lg font-semibold mb-3">Evolução do Peso</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => `${value}kg`}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                type="monotone"
                dataKey="peso"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Peso (kg)"
                dot={{ fill: "hsl(var(--primary))", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico Comparativo */}
        <Card className="p-4 gradient-card border-border/50 shadow-card">
          <h2 className="text-lg font-semibold mb-3">Evolução Completa</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="peso"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Peso (kg)"
                dot={{ fill: "hsl(var(--primary))", r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="reps"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                name="Reps"
                dot={{ fill: "hsl(var(--secondary))", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Volume */}
        <Card className="p-4 gradient-card border-border/50 shadow-card">
          <h2 className="text-lg font-semibold mb-3">Evolução do Volume</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tick={{ fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  fontSize: "12px",
                }}
                formatter={(value: number) => `${value.toFixed(1)}t`}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Bar
                dataKey="volume"
                fill="hsl(var(--primary))"
                name="Volume (t)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Histórico Detalhado */}
        <Card className="p-4 gradient-card border-border/50 shadow-card">
          <h2 className="text-lg font-semibold mb-3">Histórico Completo</h2>
          <div className="space-y-2">
            {history.map((h, index) => (
              <Link
                key={index}
                to={`/treinos/editar/${h.treinoId}`}
                className="block p-3 rounded-lg bg-background border border-border hover:border-primary transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{h.treinoName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.date).toLocaleDateString("pt-BR")} • {h.sets}x{h.reps}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{h.peso}kg</p>
                    <p className="text-xs text-muted-foreground">
                      {formatVolume(h.volume)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExercicioDetalhes;

