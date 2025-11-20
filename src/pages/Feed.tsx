import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProfileAvatar from "@/components/ProfileAvatar";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  TrendingUp,
  Users,
  Plus,
  Clock,
  Trophy,
  Calendar,
  Users as UsersIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { socialService, type SharedTreino, type TreinoComment } from "@/services/socialService";
import { treinoService } from "@/services/treinoService";
import { groupService, type QuickWorkout } from "@/services/groupService";
import { followService } from "@/services/followService";
import { groupPostsService, type GroupPost } from "@/services/groupPostsService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import QuickWorkoutDialog from "@/components/QuickWorkoutDialog";
import GroupsManager from "@/components/GroupsManager";
import GroupRankingDialog from "@/components/GroupRankingDialog";
import GlobalRankingDialog from "@/components/GlobalRankingDialog";
import MyGroupsDialog from "@/components/MyGroupsDialog";
import GroupPostCard from "@/components/GroupPostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import LazyImage from "@/components/LazyImage";
import { getDailyEmojiForUser } from "@/utils/dailyEmoji";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Feed = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [feed, setFeed] = useState<SharedTreino[]>([]);
  const [quickWorkouts, setQuickWorkouts] = useState<QuickWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTreino, setSelectedTreino] = useState<SharedTreino | null>(null);
  const [comments, setComments] = useState<TreinoComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [quickWorkoutDialogOpen, setQuickWorkoutDialogOpen] = useState(false);
  const [groupsManagerOpen, setGroupsManagerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "workouts" | "shared" | "following">("all");
  const [followingPosts, setFollowingPosts] = useState<GroupPost[]>([]);
  const [rankingDialogOpen, setRankingDialogOpen] = useState(false);
  const [selectedGroupForRanking, setSelectedGroupForRanking] = useState<{ id: string; name: string } | null>(null);
  const [userGroups, setUserGroups] = useState<Array<{ id: string; name: string }>>([]);
  const [globalRankingOpen, setGlobalRankingOpen] = useState(false);
  const [myGroupsDialogOpen, setMyGroupsDialogOpen] = useState(false);
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFeed();
    loadUserGroups();
  }, []);

  const loadUserGroups = async () => {
    if (!user) return;
    try {
      const groups = await groupService.getGroups(user.id);
      setUserGroups(groups.map(g => ({ id: g.id, name: g.name })));
    } catch (error) {
      console.error("Erro ao carregar grupos:", error);
    }
  };

  const loadFeed = async () => {
    if (!user) return;
    
    try {
      const [feedData, workoutsData, followingData] = await Promise.all([
        socialService.getFeed(50),
        groupService.getFeedWorkouts(undefined, undefined, 50),
        followService.getFollowingFeed(user.id, 50),
      ]);
      setFeed(feedData);
      setQuickWorkouts(workoutsData);
      setFollowingPosts(followingData);
    } catch (error) {
      console.error("Erro ao carregar feed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (sharedTreinoId: string) => {
    if (!user) return;

    try {
      const liked = await socialService.likeTreino(sharedTreinoId, user.id);
      loadFeed();
      toast({
        title: liked ? "Curtido!" : "Descurtido",
        description: liked ? "Você curtiu este treino" : "Você removeu sua curtida",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível curtir o treino.",
        variant: "destructive",
      });
    }
  };

  const handleComment = async (sharedTreino: SharedTreino) => {
    setSelectedTreino(sharedTreino);
    try {
      const treinoComments = await socialService.getComments(sharedTreino.id);
      setComments(treinoComments);
      setCommentDialogOpen(true);
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
      setComments([]);
      setCommentDialogOpen(true);
    }
  };

  const submitComment = async () => {
    if (!user || !selectedTreino || !newComment.trim()) return;

    try {
      await socialService.addComment(selectedTreino.id, user.id, user.name, newComment);
      const updatedComments = await socialService.getComments(selectedTreino.id);
      setComments(updatedComments);
      setNewComment("");
      loadFeed();
      toast({
        title: "Comentário adicionado!",
        description: "Seu comentário foi publicado.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o comentário.",
        variant: "destructive",
      });
    }
  };

  const getTreinoDetails = (treinoId: string) => {
    if (!user) return null;
    // Buscar treino original (se for do usuário) ou usar dados compartilhados
    return treinoService.getTreino(treinoId, user.id);
  };

  const formatVolume = (kg: number) => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${Math.round(kg)}kg`;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground text-sm">Carregando feed...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">Feed da Comunidade</h1>
            <p className="text-muted-foreground text-sm">
              Veja treinos compartilhados pela comunidade
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {userGroups.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMyGroupsDialogOpen(true)}
                  className="flex-1 md:flex-initial"
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Meus Grupos
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 md:flex-initial"
                    >
                      <Trophy className="h-4 w-4 mr-2" />
                      Ranking
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {userGroups.map((group) => (
                      <DropdownMenuItem
                        key={group.id}
                        onClick={() => {
                          setSelectedGroupForRanking(group);
                          setRankingDialogOpen(true);
                        }}
                      >
                        <Trophy className="h-4 w-4 mr-2" />
                        {group.name}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGlobalRankingOpen(true)}
              className="flex-1 md:flex-initial"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Ranking Geral
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGroupsManagerOpen(true)}
              className="flex-1 md:flex-initial"
            >
              <UsersIcon className="h-4 w-4 mr-2" />
              {userGroups.length > 0 ? "Gerenciar" : "Criar Grupo"}
            </Button>
            <Button
              size="sm"
              onClick={() => setQuickWorkoutDialogOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90 flex-1 md:flex-initial"
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Treino
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Tudo</TabsTrigger>
            <TabsTrigger value="following">Seguindo</TabsTrigger>
            <TabsTrigger value="workouts">Treinos Rápidos</TabsTrigger>
            <TabsTrigger value="shared">Compartilhados</TabsTrigger>
          </TabsList>

          {/* Tab: Seguindo */}
          <TabsContent value="following" className="space-y-4 mt-4">
            {followingPosts.length === 0 ? (
              <Card className="p-12 gradient-card border-border/50 text-center">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum post de quem você segue</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Comece a seguir pessoas para ver seus posts aqui!
                </p>
                <Button onClick={() => navigate("/feed")} variant="outline">
                  Explorar Feed
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {followingPosts.map((post) => (
                  <GroupPostCard
                    key={post.id}
                    post={post}
                    currentUserId={user?.id || ""}
                    currentUserName={user?.name || ""}
                    onDelete={() => {
                      setFollowingPosts(followingPosts.filter((p) => p.id !== post.id));
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Tab: Tudo */}
          <TabsContent value="all" className="space-y-4 mt-4">
            {feed.length === 0 && quickWorkouts.length === 0 ? (
              <Card className="p-12 gradient-card border-border/50 text-center">
                <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Feed vazio</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Ainda não há treinos. Seja o primeiro a registrar!
                </p>
                <Button onClick={() => setQuickWorkoutDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Treino
                </Button>
              </Card>
            ) : (
              <>
                {/* Quick Workouts */}
                {quickWorkouts.map((workout) => {
                  const dailyEmoji = getDailyEmojiForUser(workout.user_id, new Date(workout.date));
                  const formatDuration = () => {
                    const parts: string[] = [];
                    if (workout.duration_hours && workout.duration_hours > 0) {
                      parts.push(`${workout.duration_hours}h`);
                    }
                    if (workout.duration_minutes_detailed !== undefined && workout.duration_minutes_detailed > 0) {
                      parts.push(`${workout.duration_minutes_detailed}min`);
                    } else if (workout.duration_minutes > 0) {
                      parts.push(`${workout.duration_minutes}min`);
                    }
                    if (workout.duration_seconds && workout.duration_seconds > 0) {
                      parts.push(`${workout.duration_seconds}s`);
                    }
                    return parts.length > 0 ? parts.join(" ") : "0min";
                  };

                  return (
                    <Card key={workout.id} className="p-4 gradient-card border-border/50 shadow-card hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <ProfileAvatar
                            userId={workout.user_id}
                            userName={workout.user_name}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate">{workout.user_name}</p>
                              <span className="text-lg flex-shrink-0" title="Emoji do dia">
                                {dailyEmoji}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(workout.created_at).toLocaleDateString("pt-BR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Trophy className="h-4 w-4 text-primary" />
                          <span className="font-bold text-primary text-sm">{workout.points}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold">{workout.activity_name}</span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {workout.start_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{workout.start_time}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(workout.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                          </div>
                        </div>

                        {workout.photo_url && (
                          <div className="w-full h-48 rounded-lg overflow-hidden border border-border mt-2">
                            <LazyImage
                              src={workout.photo_url}
                              alt={`Foto do treino de ${workout.user_name}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {workout.challenge_ids && workout.challenge_ids.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {workout.challenge_ids.map((challengeId) => (
                              <Badge key={challengeId} variant="secondary" className="text-xs">
                                Desafio
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}

                {/* Shared Treinos */}
                {feed.map((sharedTreino) => {
              const treino = sharedTreino.treinoData || getTreinoDetails(sharedTreino.treinoId);
              const hasLiked = user ? socialService.hasUserLiked(sharedTreino.id, user.id) : false;
              const dailyEmoji = getDailyEmojiForUser(sharedTreino.userId, new Date(sharedTreino.sharedAt));

              return (
                <Card
                  key={sharedTreino.id}
                  className="p-4 gradient-card border-border/50 shadow-card hover:border-primary/30 transition-colors"
                >
                  {/* Header do post */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <ProfileAvatar
                        userId={sharedTreino.userId}
                        userName={sharedTreino.userName}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{sharedTreino.userName}</p>
                          <span className="text-lg flex-shrink-0" title="Emoji do dia">
                            {dailyEmoji}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sharedTreino.sharedAt).toLocaleDateString("pt-BR", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Reportar</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Conteúdo do treino */}
                  <div className="mb-3">
                    <h3 className="font-bold text-lg mb-2">
                      {treino?.name || "Treino Compartilhado"}
                    </h3>
                    <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                      <span>{treino?.exercises?.length || 0} exercícios</span>
                      <span>•</span>
                      <span className="font-semibold text-primary">
                        {treino ? formatVolume(treino.totalVolume) : "N/A"}
                      </span>
                    </div>
                    
                    {/* Lista de exercícios (expandível) */}
                    {treino?.exercises && treino.exercises.length > 0 && (() => {
                      const isExpanded = expandedExercises.has(sharedTreino.id);
                      const exercisesToShow = isExpanded ? treino.exercises : treino.exercises.slice(0, 3);
                      const hasMore = treino.exercises.length > 3;
                      
                      return (
                        <div className="mt-3 space-y-2">
                          {exercisesToShow.map((exercise, index) => (
                            <div
                              key={index}
                              className="text-xs p-2 rounded bg-background border border-border"
                            >
                              <span className="font-medium">{exercise.name}</span>
                              <span className="text-muted-foreground ml-2">
                                {exercise.sets}x{exercise.reps} @ {exercise.weight}kg
                              </span>
                            </div>
                          ))}
                          {hasMore && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
                              onClick={() => {
                                const newExpanded = new Set(expandedExercises);
                                if (isExpanded) {
                                  newExpanded.delete(sharedTreino.id);
                                } else {
                                  newExpanded.add(sharedTreino.id);
                                }
                                setExpandedExercises(newExpanded);
                              }}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="h-3 w-3" />
                                  Ver menos
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3" />
                                  +{treino.exercises.length - 3} exercícios
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      );
                    })()}
                    {sharedTreino.tags && sharedTreino.tags.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {sharedTreino.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-4 pt-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(sharedTreino.id)}
                      className={cn(
                        "gap-2",
                        hasLiked && "text-red-500 hover:text-red-500"
                      )}
                    >
                      <Heart
                        className={cn("h-4 w-4", hasLiked && "fill-current")}
                      />
                      <span>{sharedTreino.likes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComment(sharedTreino)}
                      className="gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>{sharedTreino.comments}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (navigator.share && treino) {
                          navigator.share({
                            title: treino.name,
                            text: `Confira meu treino: ${treino.name}`,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          toast({
                            title: "Link copiado!",
                            description: "Link do treino copiado para a área de transferência.",
                          });
                        }
                      }}
                      className="gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
              </>
            )}
          </TabsContent>

          {/* Tab: Treinos Rápidos */}
          <TabsContent value="workouts" className="space-y-4 mt-4">
            {quickWorkouts.length === 0 ? (
              <Card className="p-12 gradient-card border-border/50 text-center">
                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum treino rápido ainda</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Registre seu primeiro treino rápido!
                </p>
                <Button onClick={() => setQuickWorkoutDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar Treino
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {quickWorkouts.map((workout) => {
                  const dailyEmoji = getDailyEmojiForUser(workout.user_id, new Date(workout.date));
                  const formatDuration = () => {
                    const parts: string[] = [];
                    if (workout.duration_hours && workout.duration_hours > 0) {
                      parts.push(`${workout.duration_hours}h`);
                    }
                    if (workout.duration_minutes_detailed !== undefined && workout.duration_minutes_detailed > 0) {
                      parts.push(`${workout.duration_minutes_detailed}min`);
                    } else if (workout.duration_minutes > 0) {
                      parts.push(`${workout.duration_minutes}min`);
                    }
                    if (workout.duration_seconds && workout.duration_seconds > 0) {
                      parts.push(`${workout.duration_seconds}s`);
                    }
                    return parts.length > 0 ? parts.join(" ") : "0min";
                  };

                  return (
                    <Card key={workout.id} className="p-4 gradient-card border-border/50 shadow-card hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <ProfileAvatar
                            userId={workout.user_id}
                            userName={workout.user_name}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm truncate">{workout.user_name}</p>
                              <span className="text-lg flex-shrink-0" title="Emoji do dia">
                                {dailyEmoji}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {new Date(workout.created_at).toLocaleDateString("pt-BR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Trophy className="h-4 w-4 text-primary" />
                          <span className="font-bold text-primary text-sm">{workout.points}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {workout.photo_url && (
                          <div className="w-full h-48 rounded-lg overflow-hidden border border-border">
                            <LazyImage
                              src={workout.photo_url}
                              alt={`Foto do treino de ${workout.user_name}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-semibold">{workout.activity_name}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          {workout.start_time && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{workout.start_time}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatDuration()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(workout.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                          </div>
                        </div>
                        {workout.challenge_ids && workout.challenge_ids.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {workout.challenge_ids.map((challengeId) => (
                              <Badge key={challengeId} variant="secondary" className="text-xs">
                                Desafio
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Tab: Compartilhados */}
          <TabsContent value="shared" className="space-y-4 mt-4">
            {feed.length === 0 ? (
              <Card className="p-12 gradient-card border-border/50 text-center">
                <Share2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhum treino compartilhado ainda</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Compartilhe seus treinos com a comunidade!
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {feed.map((sharedTreino) => {
                  const treino = sharedTreino.treinoData || getTreinoDetails(sharedTreino.treinoId);
                  const hasLiked = user ? socialService.hasUserLiked(sharedTreino.id, user.id) : false;

                  return (
                    <Card
                      key={sharedTreino.id}
                      className="p-4 gradient-card border-border/50 shadow-card"
                    >
                      {/* Header do post */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <ProfileAvatar
                            userId={sharedTreino.userId}
                            userName={sharedTreino.userName}
                            size="md"
                          />
                          <div>
                            <p className="font-semibold text-sm">{sharedTreino.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(sharedTreino.sharedAt).toLocaleDateString("pt-BR", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Reportar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Conteúdo do treino */}
                      <div className="mb-3">
                        <h3 className="font-bold text-lg mb-2">
                          {treino?.name || "Treino Compartilhado"}
                        </h3>
                        <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                          <span>{treino?.exercises?.length || 0} exercícios</span>
                          <span>•</span>
                          <span className="font-semibold text-primary">
                            {treino ? formatVolume(treino.totalVolume) : "N/A"}
                          </span>
                        </div>
                        
                        {/* Lista de exercícios (expandível) */}
                        {treino?.exercises && treino.exercises.length > 0 && (() => {
                          const isExpanded = expandedExercises.has(sharedTreino.id);
                          const exercisesToShow = isExpanded ? treino.exercises : treino.exercises.slice(0, 3);
                          const hasMore = treino.exercises.length > 3;
                          
                          return (
                            <div className="mt-3 space-y-2">
                              {exercisesToShow.map((exercise, index) => (
                                <div
                                  key={index}
                                  className="text-xs p-2 rounded bg-background border border-border"
                                >
                                  <span className="font-medium">{exercise.name}</span>
                                  <span className="text-muted-foreground ml-2">
                                    {exercise.sets}x{exercise.reps} @ {exercise.weight}kg
                                  </span>
                                </div>
                              ))}
                              {hasMore && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedExercises);
                                    if (isExpanded) {
                                      newExpanded.delete(sharedTreino.id);
                                    } else {
                                      newExpanded.add(sharedTreino.id);
                                    }
                                    setExpandedExercises(newExpanded);
                                  }}
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="h-3 w-3" />
                                      Ver menos
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-3 w-3" />
                                      +{treino.exercises.length - 3} exercícios
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          );
                        })()}
                        {sharedTreino.tags && sharedTreino.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap mt-2">
                            {sharedTreino.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-4 pt-3 border-t border-border">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(sharedTreino.id)}
                          className={cn(
                            "gap-2",
                            hasLiked && "text-red-500 hover:text-red-500"
                          )}
                        >
                          <Heart
                            className={cn("h-4 w-4", hasLiked && "fill-current")}
                          />
                          <span>{sharedTreino.likes}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleComment(sharedTreino)}
                          className="gap-2"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>{sharedTreino.comments}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (navigator.share && treino) {
                              navigator.share({
                                title: treino.name,
                                text: `Confira meu treino: ${treino.name}`,
                                url: window.location.href,
                              });
                            } else {
                              navigator.clipboard.writeText(window.location.href);
                              toast({
                                title: "Link copiado!",
                                description: "Link do treino copiado para a área de transferência.",
                              });
                            }
                          }}
                          className="gap-2"
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialog de Comentários */}
        <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Comentários</DialogTitle>
              <DialogDescription>
                {selectedTreino?.userName} compartilhou este treino
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Lista de comentários */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum comentário ainda. Seja o primeiro!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <ProfileAvatar
                        userId={comment.userId}
                        userName={comment.userName}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm">{comment.userName}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <p className="text-sm">{comment.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Input de comentário */}
              {user && (
                <div className="flex gap-2 pt-4 border-t">
                  <Input
                    placeholder="Adicione um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && newComment.trim()) {
                        submitComment();
                      }
                    }}
                  />
                  <Button onClick={submitComment} disabled={!newComment.trim()}>
                    Enviar
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Quick Workout Dialog */}
        <QuickWorkoutDialog
          open={quickWorkoutDialogOpen}
          onOpenChange={setQuickWorkoutDialogOpen}
          onWorkoutCreated={() => {
            loadFeed();
          }}
        />

        {/* Groups Manager */}
        <GroupsManager
          open={groupsManagerOpen}
          onOpenChange={setGroupsManagerOpen}
        />

        {selectedGroupForRanking && (
          <GroupRankingDialog
            open={rankingDialogOpen}
            onOpenChange={setRankingDialogOpen}
            groupId={selectedGroupForRanking.id}
            groupName={selectedGroupForRanking.name}
          />
        )}

        {/* Ranking Global */}
        <GlobalRankingDialog
          open={globalRankingOpen}
          onOpenChange={setGlobalRankingOpen}
        />

        {/* Meus Grupos Dialog */}
        <MyGroupsDialog
          open={myGroupsDialogOpen}
          onOpenChange={setMyGroupsDialogOpen}
          onOpenGroupsManager={() => setGroupsManagerOpen(true)}
        />
      </div>
    </div>
  );
};

export default Feed;

