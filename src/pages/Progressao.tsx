import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TrendingUp, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { treinoService } from "@/services/treinoService";
import type { Treino } from "@/services/treinoService";
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

const Progressao = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTreinos();
    }
  }, [user]);

  const loadTreinos = () => {
    if (!user) return;
    const userTreinos = treinoService.getTreinos(user.id);
    const sorted = userTreinos.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    setTreinos(sorted);
    setLoading(false);
  };

  // Obter lista de exercícios únicos
  const exercises = Array.from(
    new Set(treinos.flatMap((t) => t.exercises.map((e) => e.name)))
  ).filter(Boolean);

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)}kg`;
  };

  // Preparar dados para gráfico de volume ao longo do tempo
  const volumeData = treinos.map((treino) => ({
    date: new Date(treino.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
    volume: treino.totalVolume / 1000, // em toneladas para o gráfico
    treinos: 1,
  }));

  // Agrupar por mês
  const monthlyData = treinos.reduce((acc, treino) => {
    const date = new Date(treino.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthLabel, volume: 0, treinos: 0 };
    }
    acc[monthKey].volume += treino.totalVolume / 1000; // em toneladas para o gráfico
    acc[monthKey].treinos += 1;
    return acc;
  }, {} as Record<string, { month: string; volume: number; treinos: number }>);

  const monthlyChartData = Object.values(monthlyData);

  // Preparar dados para progressão de exercício específico
  const exerciseProgressData = selectedExercise !== "all" 
    ? treinos
        .filter((t) => t.exercises.some((e) => e.name === selectedExercise))
        .map((treino) => {
          const exercise = treino.exercises.find((e) => e.name === selectedExercise);
          if (!exercise) return null;
          return {
            date: new Date(treino.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }),
            peso: exercise.weight,
            reps: exercise.reps,
            series: exercise.sets,
            volume: exercise.sets * exercise.reps * exercise.weight,
          };
        })
        .filter(Boolean)
    : [];

  // Calcular recordes pessoais
  const personalRecords = exercises.map((exerciseName) => {
    const allExercises = treinos
      .flatMap((t) => t.exercises.filter((e) => e.name === exerciseName))
      .filter((e) => e.weight > 0);

    if (allExercises.length === 0) return null;

    const maxWeight = Math.max(...allExercises.map((e) => e.weight));
    const maxVolume = Math.max(
      ...allExercises.map((e) => e.sets * e.reps * e.weight)
    );
    const maxReps = Math.max(...allExercises.map((e) => e.reps));

    return {
      exercise: exerciseName,
      maxWeight,
      maxVolume,
      maxReps,
    };
  }).filter(Boolean);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground text-sm">Carregando dados...</p>
          </div>
        </div>
      </div>
    );
  }

  if (treinos.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Progressão</h1>
            <p className="text-muted-foreground text-sm">
              Acompanhe sua evolução em cada exercício
            </p>
          </div>
          <Card className="p-8 gradient-card border-border/50 text-center">
            <TrendingUp className="h-12 w-12 text-primary mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Nenhum treino registrado</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Comece a registrar seus treinos para ver gráficos de progressão
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold mb-1">Progressão</h1>
          <p className="text-muted-foreground text-sm">
            Acompanhe sua evolução em cada exercício
          </p>
        </div>

        {/* Volume ao longo do tempo */}
        <Card className="p-4 gradient-card border-border/50 shadow-card">
          <h2 className="text-lg font-semibold mb-3">Volume por Treino</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={volumeData}>
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
              <Line
                type="monotone"
                dataKey="volume"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                name="Volume"
                dot={{ fill: "hsl(var(--primary))", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Volume mensal */}
        {monthlyChartData.length > 0 && (
          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <h2 className="text-lg font-semibold mb-3">Volume Mensal</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
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
                  formatter={(value: number, name: string) => 
                    name === "volume" ? `${value.toFixed(1)}t` : value
                  }
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="volume" fill="hsl(var(--primary))" name="Volume" />
                <Bar dataKey="treinos" fill="hsl(var(--secondary))" name="Treinos" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Progressão de exercício específico */}
        {exercises.length > 0 && (
          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <div className="mb-3">
              <h2 className="text-lg font-semibold mb-2">Progressão por Exercício</h2>
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um exercício" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os exercícios</SelectItem>
                  {exercises.map((exercise) => (
                    <SelectItem key={exercise} value={exercise}>
                      {exercise}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedExercise !== "all" && exerciseProgressData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={exerciseProgressData}>
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
                    formatter={(value: number, name: string) => 
                      `${value}${name === "peso" ? "kg" : "kg"}`
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="peso"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="Peso"
                    dot={{ fill: "hsl(var(--primary))", r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="volume"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    name="Volume"
                    dot={{ fill: "hsl(var(--secondary))", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : selectedExercise !== "all" ? (
              <p className="text-muted-foreground text-sm text-center py-6">
                Nenhum dado disponível para este exercício
              </p>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-6">
                Selecione um exercício para ver a progressão
              </p>
            )}
          </Card>
        )}

        {/* Recordes pessoais */}
        {personalRecords.length > 0 && (
          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <h2 className="text-lg font-semibold mb-3">Recordes Pessoais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {personalRecords.map((record, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg bg-background border border-border hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-sm">{record.exercise}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/exercicio/${encodeURIComponent(record.exercise)}`)}
                      className="h-6 w-6 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-muted-foreground">
                      Maior peso: <span className="text-primary font-bold">{record.maxWeight}kg</span>
                    </p>
                    <p className="text-muted-foreground">
                      Maior volume: <span className="text-primary font-bold">{formatVolume(record.maxVolume)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Mais reps: <span className="text-primary font-bold">{record.maxReps}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Progressao;
