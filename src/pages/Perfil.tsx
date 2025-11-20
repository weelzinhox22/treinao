import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Calendar,
  TrendingUp,
  Target,
  Camera,
  Edit2,
  Save,
  X,
  Camera as CameraIcon,
  User,
  Mail,
  Award,
  Activity,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { gamificationService } from "@/services/gamificationService";
import { treinoService } from "@/services/treinoService";
import { metasService } from "@/services/metasService";
import { fotoService } from "@/services/fotoService";
import { useToast } from "@/hooks/use-toast";
import UploadAvatarDialog from "@/components/UploadAvatarDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Badge as BadgeType } from "@/services/gamificationService";

const Perfil = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");
  const [saving, setSaving] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<BadgeType[]>([]);
  const [stats, setStats] = useState({
    totalTreinos: 0,
    totalVolume: 0,
    streak: 0,
    totalMetas: 0,
    metasAlcancadas: 0,
    totalFotos: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfileData();
      setEditedName(user.name);
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      // Carregar badges
      const allBadges = gamificationService.getAllBadges();
      const unlocked = gamificationService.getUnlockedBadges(user.id);
      setBadges(allBadges);
      setUnlockedBadges(unlocked);

      // Carregar estatísticas
      const userStats = treinoService.getStats(user.id);
      const metas = metasService.getMetas(user.id);
      const fotos = fotoService.getFotos(user.id);

      setStats({
        totalTreinos: userStats.totalTreinos,
        totalVolume: userStats.totalVolume,
        streak: userStats.streak,
        totalMetas: metas.length,
        metasAlcancadas: metas.filter((m) => m.achieved).length,
        totalFotos: fotos.length,
      });
    } catch (error) {
      console.error("Erro ao carregar dados do perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) return;

    setSaving(true);
    try {
      // Atualizar no Supabase
      await profileService.updateProfile(user.id, { name: editedName.trim() });

      // Atualizar no contexto
      const updatedUser = { ...user, name: editedName.trim() };
      updateUser(updatedUser);

      toast({
        title: "Nome atualizado!",
        description: "Seu nome foi atualizado com sucesso.",
      });

      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o nome.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(user?.name || "");
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)}kg`;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header do Perfil */}
        <Card className="p-6 md:p-8 gradient-card border-border/50 shadow-card">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary/20">
                {user?.avatar_url && (
                  <AvatarImage src={user.avatar_url} alt={user.name} />
                )}
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl md:text-3xl">
                  {getInitials(user?.name || "U")}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
                onClick={() => setAvatarDialogOpen(true)}
              >
                <CameraIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Informações */}
            <div className="flex-1 text-center md:text-left w-full">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="mt-1"
                      maxLength={50}
                    />
                  </div>
                  <div className="flex gap-2 justify-center md:justify-start">
                    <Button
                      size="sm"
                      onClick={handleSaveName}
                      disabled={saving || !editedName.trim()}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? "Salvando..." : "Salvar"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold">{user?.name}</h1>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Membro desde {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Treinos</p>
                <p className="text-xl font-bold">{stats.totalTreinos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume Total</p>
                <p className="text-xl font-bold">{formatVolume(stats.totalVolume * 1000)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sequência</p>
                <p className="text-xl font-bold">{stats.streak} dias</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Metas</p>
                <p className="text-xl font-bold">
                  {stats.metasAlcancadas}/{stats.totalMetas}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Conquistas</p>
                <p className="text-xl font-bold">{unlockedBadges.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 gradient-card border-border/50 shadow-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Camera className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fotos</p>
                <p className="text-xl font-bold">{stats.totalFotos}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="badges" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="badges">Conquistas</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="badges" className="space-y-4">
            <Card className="p-6 gradient-card border-border/50 shadow-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold mb-1">Suas Conquistas</h2>
                  <p className="text-sm text-muted-foreground">
                    {unlockedBadges.length} de {badges.length} desbloqueadas
                  </p>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  {Math.round((unlockedBadges.length / badges.length) * 100)}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {badges.map((badge) => {
                  const isUnlocked = unlockedBadges.some((b) => b.id === badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isUnlocked
                          ? "border-primary bg-primary/5 shadow-glow"
                          : "border-border/50 bg-background/50 opacity-50"
                      }`}
                    >
                      <div className="text-4xl mb-2 text-center">{badge.emoji}</div>
                      <p className="text-xs font-semibold text-center mb-1">{badge.name}</p>
                      {isUnlocked && (
                        <Badge variant="default" className="w-full justify-center text-xs">
                          Desbloqueada
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <Card className="p-6 gradient-card border-border/50 shadow-card">
              <h2 className="text-xl font-bold mb-4">Estatísticas Detalhadas</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-lg bg-background/50">
                  <span className="text-muted-foreground">Total de Treinos</span>
                  <span className="font-bold text-lg">{stats.totalTreinos}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg bg-background/50">
                  <span className="text-muted-foreground">Volume Total</span>
                  <span className="font-bold text-lg">{formatVolume(stats.totalVolume * 1000)}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg bg-background/50">
                  <span className="text-muted-foreground">Sequência Atual</span>
                  <span className="font-bold text-lg">{stats.streak} dias</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg bg-background/50">
                  <span className="text-muted-foreground">Metas Alcançadas</span>
                  <span className="font-bold text-lg">
                    {stats.metasAlcancadas} de {stats.totalMetas}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg bg-background/50">
                  <span className="text-muted-foreground">Conquistas Desbloqueadas</span>
                  <span className="font-bold text-lg">{unlockedBadges.length}</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-lg bg-background/50">
                  <span className="text-muted-foreground">Fotos de Progresso</span>
                  <span className="font-bold text-lg">{stats.totalFotos}</span>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Avatar Upload Dialog */}
      <UploadAvatarDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        onUploaded={() => {
          loadProfileData();
        }}
      />
    </div>
  );
};

export default Perfil;

