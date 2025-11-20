import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Trash2,
  Edit2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { weightService, type UserWeight, type WeightStats } from "@/services/weightService";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const Peso = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weights, setWeights] = useState<UserWeight[]>([]);
  const [stats, setStats] = useState<WeightStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState<UserWeight | null>(null);
  const [formData, setFormData] = useState({
    weight: "",
    bodyFat: "",
    muscleMass: "",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      loadWeights();
    }
  }, [user]);

  const loadWeights = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [weightsData, statsData] = await Promise.all([
        weightService.getWeights(user.id),
        weightService.getWeightStats(user.id),
      ]);

      setWeights(weightsData);
      setStats(statsData);
    } catch (error) {
      console.error("Erro ao carregar pesos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de peso.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const weight = parseFloat(formData.weight);
    if (isNaN(weight) || weight <= 0) {
      toast({
        title: "Erro",
        description: "Peso inválido.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingWeight) {
        await weightService.updateWeight(
          editingWeight.id,
          weight,
          formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
          formData.muscleMass ? parseFloat(formData.muscleMass) : undefined,
          formData.notes || undefined
        );
        toast({
          title: "Peso atualizado!",
          description: "Seu registro de peso foi atualizado com sucesso.",
        });
      } else {
        await weightService.addWeight(
          user.id,
          weight,
          formData.bodyFat ? parseFloat(formData.bodyFat) : undefined,
          formData.muscleMass ? parseFloat(formData.muscleMass) : undefined,
          formData.notes || undefined
        );
        toast({
          title: "Peso registrado!",
          description: "Seu peso foi registrado com sucesso.",
        });
      }

      setDialogOpen(false);
      setEditingWeight(null);
      setFormData({ weight: "", bodyFat: "", muscleMass: "", notes: "" });
      loadWeights();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o peso.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (weight: UserWeight) => {
    setEditingWeight(weight);
    setFormData({
      weight: weight.weight.toString(),
      bodyFat: weight.body_fat_percentage?.toString() || "",
      muscleMass: weight.muscle_mass?.toString() || "",
      notes: weight.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (weightId: string) => {
    if (!confirm("Tem certeza que deseja deletar este registro?")) return;

    try {
      await weightService.deleteWeight(weightId);
      toast({
        title: "Registro deletado",
        description: "O registro de peso foi deletado com sucesso.",
      });
      loadWeights();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível deletar o registro.",
        variant: "destructive",
      });
    }
  };

  const chartData = weights
    .slice()
    .reverse()
    .map((w) => ({
      date: format(new Date(w.created_at), "dd/MM", { locale: ptBR }),
      peso: w.weight,
      gordura: w.body_fat_percentage || null,
      musculo: w.muscle_mass || null,
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

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Rastreamento de Peso</h1>
            <p className="text-muted-foreground">
              Acompanhe sua evolução corporal
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingWeight(null);
              setFormData({ weight: "", bodyFat: "", muscleMass: "", notes: "" });
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Peso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingWeight ? "Editar Registro" : "Novo Registro de Peso"}
                </DialogTitle>
                <DialogDescription>
                  Registre seu peso e acompanhe sua progressão
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="weight">Peso (kg) *</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    placeholder="Ex: 75.5"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bodyFat">% Gordura Corporal</Label>
                    <Input
                      id="bodyFat"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.bodyFat}
                      onChange={(e) => setFormData({ ...formData, bodyFat: e.target.value })}
                      placeholder="Ex: 15.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="muscleMass">Massa Muscular (kg)</Label>
                    <Input
                      id="muscleMass"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.muscleMass}
                      onChange={(e) => setFormData({ ...formData, muscleMass: e.target.value })}
                      placeholder="Ex: 60.0"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Anotações sobre este registro..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingWeight(null);
                      setFormData({ weight: "", bodyFat: "", muscleMass: "", notes: "" });
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingWeight ? "Atualizar" : "Salvar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Peso Atual</p>
              </div>
              <p className="text-2xl font-bold">{stats.latest_weight.toFixed(1)} kg</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Minus className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Mudança</p>
              </div>
              <p className={`text-2xl font-bold ${stats.weight_change && stats.weight_change < 0 ? 'text-green-500' : stats.weight_change && stats.weight_change > 0 ? 'text-red-500' : ''}`}>
                {stats.weight_change !== undefined && stats.weight_change !== null
                  ? `${stats.weight_change > 0 ? '+' : ''}${stats.weight_change.toFixed(1)} kg`
                  : 'N/A'}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Média</p>
              </div>
              <p className="text-2xl font-bold">{stats.avg_weight.toFixed(1)} kg</p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <p className="text-sm text-muted-foreground">Registros</p>
              </div>
              <p className="text-2xl font-bold">{stats.total_records}</p>
            </Card>
          </div>
        )}

        {/* Gráfico */}
        {chartData.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Progressão de Peso</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="peso"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Peso (kg)"
                  dot={{ r: 4 }}
                />
                {chartData.some(d => d.gordura !== null) && (
                  <Line
                    type="monotone"
                    dataKey="gordura"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="% Gordura"
                    dot={{ r: 4 }}
                  />
                )}
                {chartData.some(d => d.musculo !== null) && (
                  <Line
                    type="monotone"
                    dataKey="musculo"
                    stroke="#ffc658"
                    strokeWidth={2}
                    name="Massa Muscular (kg)"
                    dot={{ r: 4 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Lista de Registros */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Histórico</h2>
          {weights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum registro de peso ainda</p>
              <p className="text-sm mt-2">Clique em "Adicionar Peso" para começar</p>
            </div>
          ) : (
            <div className="space-y-2">
              {weights.map((weight) => (
                <div
                  key={weight.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-lg font-bold">{weight.weight} kg</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(weight.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {(weight.body_fat_percentage || weight.muscle_mass) && (
                        <div className="flex gap-4 text-sm">
                          {weight.body_fat_percentage && (
                            <span className="text-muted-foreground">
                              Gordura: {weight.body_fat_percentage}%
                            </span>
                          )}
                          {weight.muscle_mass && (
                            <span className="text-muted-foreground">
                              Músculo: {weight.muscle_mass} kg
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {weight.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{weight.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(weight)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(weight.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Peso;

