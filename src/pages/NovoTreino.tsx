import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Save, ArrowLeft, Sparkles, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { treinoService } from "@/services/treinoService";
import type { Exercise, Treino } from "@/services/treinoService";
import { templatesService, type Template } from "@/services/templatesService";
import { gamificationService } from "@/services/gamificationService";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { fotoService } from "@/services/fotoService";
import ExerciseAutocomplete from "@/components/ExerciseAutocomplete";
import BadgeNotification from "@/components/BadgeNotification";
import type { Badge } from "@/services/gamificationService";
import { metasService } from "@/services/metasService";

const NovoTreino = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const isEditing = !!id;
  const [treinoName, setTreinoName] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [newBadge, setNewBadge] = useState<Badge | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: Date.now().toString(),
        name: "",
        sets: 3,
        reps: 10,
        weight: 0,
      },
    ]);
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof Exercise, value: string | number) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  useEffect(() => {
    if (user) {
      const userTemplates = templatesService.getTemplates(user.id);
      setTemplates(userTemplates);
    }
  }, [user]);

  // Atalhos de teclado
  useKeyboardShortcuts([
    {
      key: "s",
      ctrlKey: true,
      action: () => {
        if (exercises.length > 0) {
          handleSave();
        }
      },
      description: "Salvar treino",
    },
  ]);

  useEffect(() => {
    if (isEditing && id && user) {
      const treino = treinoService.getTreino(id, user.id);
      if (treino) {
        setTreinoName(treino.name);
        setExercises(treino.exercises);
      } else {
        toast({
          title: "Treino não encontrado",
          description: "O treino que você está tentando editar não existe.",
          variant: "destructive",
        });
        navigate("/treinos");
      }
    }
  }, [isEditing, id, user, navigate, toast]);

  const applyTemplate = (templateId: string) => {
    if (!user) return;
    
    const template = templatesService.getTemplate(templateId, user.id);
    if (template) {
      setExercises(
        template.exercises.map((ex) => ({
          ...ex,
          id: Date.now().toString() + Math.random(),
        }))
      );
      if (!treinoName) {
        setTreinoName(template.name);
      }
      setSelectedTemplate("");
      toast({
        title: "Template aplicado!",
        description: `Template "${template.name}" foi aplicado. Ajuste as cargas.`,
      });
    }
  };

  const saveAsTemplate = () => {
    if (!user || exercises.length === 0) return;

    if (!templateName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite um nome para o template.",
        variant: "destructive",
      });
      return;
    }

    const newTemplate = templatesService.createTemplate(
      {
        name: templateName,
        description: templateDescription || "",
        exercises: exercises.map(({ id, ...rest }) => ({ ...rest, weight: 0 })),
        category: "Personalizado",
      },
      user.id
    );

    toast({
      title: "Template salvo!",
      description: `Template "${newTemplate.name}" foi criado com sucesso.`,
    });

    setTemplates(templatesService.getTemplates(user.id));
    setSaveTemplateDialogOpen(false);
    setTemplateName("");
    setTemplateDescription("");
  };

  const handleSave = () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para salvar treinos.",
        variant: "destructive",
      });
      return;
    }

    if (exercises.length === 0) {
      toast({
        title: "Adicione exercícios",
        description: "Você precisa adicionar pelo menos um exercício.",
        variant: "destructive",
      });
      return;
    }

    if (exercises.some(ex => !ex.name.trim())) {
      toast({
        title: "Exercícios incompletos",
        description: "Todos os exercícios precisam ter um nome.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing && id) {
        treinoService.updateTreino(id, user.id, {
          name: treinoName,
          exercises: exercises,
        });
        toast({
          title: "Treino atualizado!",
          description: "Seu treino foi atualizado com sucesso.",
        });
      } else {
        treinoService.createTreino({
          userId: user.id,
          name: treinoName,
          date: new Date().toISOString().split('T')[0],
          exercises: exercises,
        });

        // Verificar e desbloquear badges
        const stats = treinoService.getStats(user.id);
        const metas = metasService.getMetas(user.id);
        const treinos = treinoService.getTreinos(user.id);
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

        const unlockedBadgeIds = gamificationService.checkAndUnlockBadges(user.id, {
          totalTreinos: stats.totalTreinos,
          streak: stats.streak,
          totalVolume: stats.totalVolume,
          recordesBatidos: 0,
          metasAlcancadas: metas.filter((m) => m.achieved).length,
          treinosEsteMes: stats.treinosThisMonth,
          treinosEsteAno: stats.totalTreinos,
          treinosEstaSemana,
          maxWeight,
          fotosAdicionadas: fotos.length,
          templatesCriados: templates.length,
        });

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

        toast({
          title: "Treino registrado!",
          description: "Seu treino foi salvo com sucesso.",
        });
      }
      navigate("/treinos");
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o treino. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const calculateTotalVolume = () => {
    return exercises.reduce((total, ex) => {
      return total + (ex.sets * ex.reps * ex.weight);
    }, 0);
  };

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)}kg`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/treinos")}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {isEditing ? "Editar Treino" : "Novo Treino"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isEditing 
                ? "Edite os exercícios do seu treino"
                : "Registre os exercícios do seu treino"}
            </p>
          </div>
        </div>

        {/* Templates e Info */}
        <div className="space-y-3">
          {!isEditing && templates.length > 0 && (
            <Card className="p-4 gradient-card border-border/50 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">Usar Template</Label>
              </div>
              <Select value={selectedTemplate} onValueChange={applyTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template para começar" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{template.name}</span>
                        {template.description && (
                          <span className="text-xs text-muted-foreground">
                            {template.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          )}

          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <div className="space-y-3">
              <div>
                <Label htmlFor="treino-name" className="text-sm">Nome do Treino</Label>
                <Input
                  id="treino-name"
                  placeholder="Ex: Peito e Tríceps"
                  value={treinoName}
                  onChange={(e) => setTreinoName(e.target.value)}
                  className="bg-background border-border mt-1"
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-background border border-border">
                <span className="text-muted-foreground text-sm">Data</span>
                <span className="font-semibold text-sm">
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Exercises */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Exercícios</h2>
            <Button
              onClick={addExercise}
              variant="outline"
              size="sm"
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="text-xs">Adicionar</span>
            </Button>
          </div>

          {exercises.map((exercise) => (
            <Card 
              key={exercise.id}
              className="p-3 gradient-card border-border/50"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <Label className="text-sm">Exercício</Label>
                    <ExerciseAutocomplete
                      value={exercise.name}
                      onChange={(value) => updateExercise(exercise.id, "name", value)}
                      placeholder="Digite o nome do exercício"
                      className="bg-background border-border mt-1 text-sm"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeExercise(exercise.id)}
                    className="mt-6 h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Séries</Label>
                    <Input
                      type="number"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(exercise.id, "sets", parseInt(e.target.value) || 0)}
                      className="bg-background border-border mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Reps</Label>
                    <Input
                      type="number"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(exercise.id, "reps", parseInt(e.target.value) || 0)}
                      className="bg-background border-border mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Peso (kg)</Label>
                    <Input
                      type="number"
                      value={exercise.weight}
                      onChange={(e) => updateExercise(exercise.id, "weight", parseFloat(e.target.value) || 0)}
                      className="bg-background border-border mt-1 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Volume: <span className="font-semibold text-primary">
                      {formatVolume(exercise.sets * exercise.reps * exercise.weight)}
                    </span>
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {exercises.length === 0 && (
            <Card className="p-8 gradient-card border-border/50 text-center">
              <p className="text-muted-foreground text-sm mb-4">
                Nenhum exercício adicionado ainda
              </p>
              <Button onClick={addExercise} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exercício
              </Button>
            </Card>
          )}
        </div>

        {/* Summary & Save */}
        {exercises.length > 0 && (
          <Card className="p-4 gradient-card border-border/50 shadow-card sticky bottom-20 md:bottom-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Volume Total</p>
                <p className="text-xl font-bold text-primary">
                  {formatVolume(calculateTotalVolume())}
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {!isEditing && (
                  <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="lg" className="flex-1 md:flex-none">
                        <Sparkles className="h-4 w-4 mr-2" />
                        Salvar como Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Salvar como Template</DialogTitle>
                        <DialogDescription>
                          Salve este treino como template para usar depois
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="template-name">Nome do Template</Label>
                          <Input
                            id="template-name"
                            placeholder="Ex: Push Day"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="template-desc">Descrição (opcional)</Label>
                          <Input
                            id="template-desc"
                            placeholder="Ex: Treino de peito, ombro e tríceps"
                            value={templateDescription}
                            onChange={(e) => setTemplateDescription(e.target.value)}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSaveTemplateDialogOpen(false);
                            setTemplateName("");
                            setTemplateDescription("");
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={saveAsTemplate} className="bg-primary text-primary-foreground">
                          Salvar Template
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
                <Button
                  onClick={handleSave}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow flex-1 md:flex-none"
                  size="lg"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Treino
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Badge Notification */}
      {newBadge && (
        <BadgeNotification
          badge={newBadge}
          onClose={() => setNewBadge(null)}
        />
      )}
    </div>
  );
};

export default NovoTreino;
