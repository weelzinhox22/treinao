import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Trash2, Trophy, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { metasService, type Meta } from "@/services/metasService";
import { useToast } from "@/hooks/use-toast";
import { treinoService } from "@/services/treinoService";
import { exercisesService } from "@/services/exercisesService";

const Metas = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [metaToDelete, setMetaToDelete] = useState<string | null>(null);

  // Form state
  const [metaType, setMetaType] = useState<Meta["type"]>("weight");
  const [exerciseName, setExerciseName] = useState("");
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (user) {
      loadMetas();
      updateMetasProgress();
    }
  }, [user]);

  const loadMetas = () => {
    if (!user) return;
    const userMetas = metasService.getMetas(user.id);
    setMetas(userMetas);
    setLoading(false);
  };

  const updateMetasProgress = () => {
    if (!user) return;

    metasService.updateProgress(user.id, (meta) => {
      const treinos = treinoService.getTreinos(user.id);

      switch (meta.type) {
        case "weight":
          if (meta.exerciseName) {
            const exercises = treinos
              .flatMap((t) => t.exercises)
              .filter((e) => e.name === meta.exerciseName);
            return exercises.length > 0
              ? Math.max(...exercises.map((e) => e.weight))
              : 0;
          }
          return 0;

        case "volume":
          if (meta.exerciseName) {
            const exercises = treinos
              .flatMap((t) => t.exercises)
              .filter((e) => e.name === meta.exerciseName);
            return exercises.reduce(
              (sum, e) => sum + e.sets * e.reps * e.weight,
              0
            );
          }
          return treinos.reduce((sum, t) => sum + t.totalVolume, 0) / 1000;

        case "reps":
          if (meta.exerciseName) {
            const exercises = treinos
              .flatMap((t) => t.exercises)
              .filter((e) => e.name === meta.exerciseName);
            return exercises.length > 0
              ? Math.max(...exercises.map((e) => e.reps))
              : 0;
          }
          return 0;

        case "treinos":
          const now = new Date();
          const thisMonth = treinos.filter(
            (t) =>
              new Date(t.date).getMonth() === now.getMonth() &&
              new Date(t.date).getFullYear() === now.getFullYear()
          );
          return thisMonth.length;

        case "streak":
          const sortedTreinos = [...treinos].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          let streak = 0;
          let currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);

          for (const treino of sortedTreinos) {
            const treinoDate = new Date(treino.date);
            treinoDate.setHours(0, 0, 0, 0);
            const diffDays = Math.floor(
              (currentDate.getTime() - treinoDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays === streak) {
              streak++;
              currentDate = treinoDate;
            } else if (diffDays > streak) {
              break;
            }
          }
          return streak;

        default:
          return 0;
      }
    });

    loadMetas();
  };

  const handleCreate = () => {
    if (!user) return;

    if (!target || isNaN(parseFloat(target)) || parseFloat(target) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido para a meta.",
        variant: "destructive",
      });
      return;
    }

    if (metaType === "weight" || metaType === "volume" || metaType === "reps") {
      if (!exerciseName.trim()) {
        toast({
          title: "Exercício obrigatório",
          description: "Selecione um exercício para esta meta.",
          variant: "destructive",
        });
        return;
      }
    }

    const unit =
      metaType === "weight"
        ? "kg"
        : metaType === "volume"
        ? "t"
        : metaType === "reps"
        ? "reps"
        : metaType === "treinos"
        ? "treinos"
        : "dias";

    const newMeta = metasService.createMeta({
      userId: user.id,
      type: metaType,
      exerciseName:
        metaType === "weight" || metaType === "volume" || metaType === "reps"
          ? exerciseName
          : undefined,
      target: parseFloat(target),
      unit,
      description: description || "",
      deadline: deadline || undefined,
    });

    toast({
      title: "Meta criada!",
      description: "Sua meta foi criada com sucesso.",
    });

    setCreateDialogOpen(false);
    resetForm();
    updateMetasProgress();
  };

  const resetForm = () => {
    setMetaType("weight");
    setExerciseName("");
    setTarget("");
    setDescription("");
    setDeadline("");
  };

  const handleDelete = (id: string) => {
    setMetaToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!user || !metaToDelete) return;

    const success = metasService.deleteMeta(metaToDelete, user.id);
    if (success) {
      toast({
        title: "Meta deletada",
        description: "A meta foi removida com sucesso.",
      });
      loadMetas();
    }
    setDeleteDialogOpen(false);
    setMetaToDelete(null);
  };

  const getProgress = (meta: Meta) => {
    return Math.min((meta.current / meta.target) * 100, 100);
  };

  const formatValue = (value: number, unit: string) => {
    if (unit === "t" && value >= 1) {
      return `${value.toFixed(1)}${unit}`;
    }
    return `${Math.round(value)}${unit}`;
  };

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

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Metas e Objetivos</h1>
            <p className="text-muted-foreground text-sm">
              Defina e acompanhe seus objetivos
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow">
                <Plus className="h-4 w-4 mr-2" />
                Nova Meta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Meta</DialogTitle>
                <DialogDescription>
                  Defina um objetivo e acompanhe seu progresso
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Tipo de Meta</Label>
                  <Select
                    value={metaType}
                    onValueChange={(value) => setMetaType(value as Meta["type"])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight">Peso (kg) - Exercício específico</SelectItem>
                      <SelectItem value="volume">Volume (t) - Exercício específico</SelectItem>
                      <SelectItem value="reps">Repetições - Exercício específico</SelectItem>
                      <SelectItem value="treinos">Treinos no Mês</SelectItem>
                      <SelectItem value="streak">Sequência de Dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(metaType === "weight" ||
                  metaType === "volume" ||
                  metaType === "reps") && (
                  <div>
                    <Label>Exercício</Label>
                    <Input
                      placeholder="Digite o nome do exercício"
                      value={exerciseName}
                      onChange={(e) => setExerciseName(e.target.value)}
                      list="exercises-list"
                    />
                    <datalist id="exercises-list">
                      {exercisesService.getAll().map((ex) => (
                        <option key={ex.id} value={ex.name} />
                      ))}
                    </datalist>
                  </div>
                )}

                <div>
                  <Label>Meta (Alvo)</Label>
                  <Input
                    type="number"
                    placeholder={
                      metaType === "weight"
                        ? "Ex: 100"
                        : metaType === "volume"
                        ? "Ex: 5"
                        : metaType === "reps"
                        ? "Ex: 12"
                        : metaType === "treinos"
                        ? "Ex: 20"
                        : "Ex: 30"
                    }
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Descrição (opcional)</Label>
                  <Input
                    placeholder="Ex: Alcançar 100kg no supino até dezembro"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div>
                  <Label>Data Limite (opcional)</Label>
                  <Input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCreateDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreate} className="bg-primary text-primary-foreground">
                  Criar Meta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Metas */}
        {metas.length === 0 ? (
          <Card className="p-8 gradient-card border-border/50 text-center">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma meta definida</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Crie sua primeira meta para começar a acompanhar seu progresso
            </p>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {metas.map((meta) => {
              const progress = getProgress(meta);
              const isAchieved = meta.achieved;

              return (
                <Card
                  key={meta.id}
                  className={`p-4 gradient-card border-border/50 ${
                    isAchieved ? "border-green-500/50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {isAchieved ? (
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        ) : (
                          <Target className="h-4 w-4 text-primary" />
                        )}
                        <h3 className="font-semibold text-sm">
                          {meta.description || "Meta sem descrição"}
                        </h3>
                      </div>
                      {meta.exerciseName && (
                        <p className="text-xs text-muted-foreground mb-1">
                          {meta.exerciseName}
                        </p>
                      )}
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-primary">
                          {formatValue(meta.current, meta.unit)}
                        </span>
                        <span className="text-sm text-muted-foreground">/</span>
                        <span className="text-sm text-muted-foreground">
                          {formatValue(meta.target, meta.unit)}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(meta.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Progress value={progress} className="mb-2" />

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {isAchieved ? (
                        <span className="text-green-500 font-semibold">
                          ✓ Meta alcançada!
                        </span>
                      ) : (
                        `${progress.toFixed(0)}% concluído`
                      )}
                    </span>
                    {meta.deadline && (
                      <span className="text-muted-foreground">
                        {new Date(meta.deadline).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar meta?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A meta será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Metas;

