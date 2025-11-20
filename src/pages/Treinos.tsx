import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Dumbbell, Plus, Trash2, Edit, Search, Download, Share2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { treinoService } from "@/services/treinoService";
import type { Treino } from "@/services/treinoService";
import { useToast } from "@/hooks/use-toast";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import SwipeableCard from "@/components/SwipeableCard";
import { TreinoCardSkeleton } from "@/components/Skeleton";
import { exportTreinosToCSV, exportTreinoToPDF } from "@/utils/exportUtils";
import ShareTreinoDialog from "@/components/ShareTreinoDialog";
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

const Treinos = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [treinos, setTreinos] = useState<Treino[]>([]);
  const [allTreinos, setAllTreinos] = useState<Treino[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [treinoToDelete, setTreinoToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "name" | "volume">("date");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "week" | "month" | "year">("all");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [treinoToShare, setTreinoToShare] = useState<Treino | null>(null);

  useEffect(() => {
    if (user) {
      loadTreinos();
    }
  }, [user]);

  // Atalhos de teclado
  useKeyboardShortcuts([
    {
      key: "n",
      ctrlKey: true,
      action: () => navigate("/treinos/novo"),
      description: "Novo treino",
    },
    {
      key: "f",
      ctrlKey: true,
      action: () => {
        const input = document.querySelector('input[placeholder*="Buscar"]') as HTMLInputElement;
        input?.focus();
      },
      description: "Buscar",
    },
  ]);

  const loadTreinos = () => {
    if (!user) return;
    const userTreinos = treinoService.getTreinos(user.id);
    setAllTreinos(userTreinos);
    setLoading(false);
  };

  // Filtrar e ordenar treinos
  const filteredTreinos = useMemo(() => {
    let filtered = [...allTreinos];

    // Filtro de período
    if (filterPeriod !== "all") {
      const now = new Date();
      filtered = filtered.filter((treino) => {
        const treinoDate = new Date(treino.date);
        switch (filterPeriod) {
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return treinoDate >= weekAgo;
          case "month":
            return (
              treinoDate.getMonth() === now.getMonth() &&
              treinoDate.getFullYear() === now.getFullYear()
            );
          case "year":
            return treinoDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // Busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (treino) =>
          treino.name.toLowerCase().includes(query) ||
          treino.exercises.some((ex) =>
            ex.name.toLowerCase().includes(query)
          )
      );
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "name":
          return (a.name || "").localeCompare(b.name || "");
        case "volume":
          return b.totalVolume - a.totalVolume;
        default:
          return 0;
      }
    });

    return filtered;
  }, [allTreinos, searchQuery, sortBy, filterPeriod]);

  const handleDelete = (id: string) => {
    setTreinoToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!user || !treinoToDelete) return;

    const success = treinoService.deleteTreino(treinoToDelete, user.id);
    if (success) {
      toast({
        title: "Treino deletado",
        description: "O treino foi removido com sucesso.",
      });
      loadTreinos();
    } else {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o treino.",
        variant: "destructive",
      });
    }
    setDeleteDialogOpen(false);
    setTreinoToDelete(null);
  };

  const handleEdit = (id: string) => {
    navigate(`/treinos/editar/${id}`);
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
        <div>
          <h1 className="text-2xl font-bold mb-1">Meus Treinos</h1>
          <p className="text-muted-foreground text-sm">
            Histórico de treinos registrados
          </p>
        </div>

        {/* Busca e Filtros */}
        {allTreinos.length > 0 && (
          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou exercício..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Ordenar por" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Data (mais recente)</SelectItem>
                      <SelectItem value="name">Nome (A-Z)</SelectItem>
                      <SelectItem value="volume">Volume (maior)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={filterPeriod}
                    onValueChange={(value) => setFilterPeriod(value as typeof filterPeriod)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="week">Última semana</SelectItem>
                      <SelectItem value="month">Este mês</SelectItem>
                      <SelectItem value="year">Este ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {filteredTreinos.length !== allTreinos.length && (
                <p className="text-xs text-muted-foreground">
                  Mostrando {filteredTreinos.length} de {allTreinos.length} treinos
                </p>
              )}
            </div>
          </Card>
        )}

        {/* Workouts List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <TreinoCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredTreinos.length === 0 ? (
          <Card className="p-8 gradient-card border-border/50 text-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Nenhum treino registrado</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Comece a registrar seus treinos
            </p>
            <Link to="/treinos/novo">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Registrar Primeiro Treino
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTreinos.map((treino) => (
              <SwipeableCard
                key={treino.id}
                onSwipeLeft={() => handleDelete(treino.id)}
                className="p-4 gradient-card border-border/50 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                    <Dumbbell className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1 text-base">{treino.name || "Treino sem nome"}</h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(treino.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                      <span>•</span>
                      <span>{treino.exercises.length} ex.</span>
                      <span>•</span>
                      <span className="font-semibold text-primary">
                        {formatVolume(treino.totalVolume)}
                      </span>
                    </div>
                    {treino.notes && (
                      <p className="text-xs text-muted-foreground italic mb-2 line-clamp-2">
                        📝 {treino.notes}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setTreinoToShare(treino);
                          setShareDialogOpen(true);
                        }}
                        className="h-8 text-xs"
                        title="Compartilhar"
                      >
                        <Share2 className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => exportTreinoToPDF(treino, user?.name)}
                        className="h-8 text-xs"
                        title="Exportar PDF"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEdit(treino.id)}
                        className="h-8 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(treino.id)}
                        className="h-8 text-xs text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </SwipeableCard>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar treino?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O treino será permanentemente removido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Share Dialog */}
        {treinoToShare && (
          <ShareTreinoDialog
            treino={treinoToShare}
            open={shareDialogOpen}
            onOpenChange={setShareDialogOpen}
            onShared={() => {
              setTreinoToShare(null);
              loadTreinos();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Treinos;
