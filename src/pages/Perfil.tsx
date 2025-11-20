import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Edit2,
  Save,
  X,
  Camera as CameraIcon,
  Mail,
  Calendar,
  Grid3x3,
  Users,
  UserPlus,
  Trophy,
  Award,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService } from "@/services/profileService";
import { followService, type UserProfileStats } from "@/services/followService";
import { groupPostsService, type GroupPost } from "@/services/groupPostsService";
import { useToast } from "@/hooks/use-toast";
import UploadAvatarDialog from "@/components/UploadAvatarDialog";
import ProfileAvatar from "@/components/ProfileAvatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/config/supabase";
import { gamificationService } from "@/services/gamificationService";
import type { Badge as BadgeType } from "@/services/gamificationService";
import { Image as ImageIcon } from "lucide-react";

const Perfil = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");
  const [editedBio, setEditedBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingBio, setSavingBio] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [profileStats, setProfileStats] = useState<UserProfileStats | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [showBadgesDialog, setShowBadgesDialog] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [unlockedBadges, setUnlockedBadges] = useState<BadgeType[]>([]);

  useEffect(() => {
    if (user) {
      loadProfileData();
      setEditedName(user.name);
      loadBio();
    }
  }, [user]);

  const loadBio = async () => {
    if (!user) return;
    try {
      const profile = await profileService.getProfile(user.id);
      setEditedBio(profile?.bio || "");
    } catch (error) {
      console.error("Erro ao carregar bio:", error);
    }
  };

  const loadProfileData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const [stats, userPosts, allBadges, unlocked] = await Promise.all([
        followService.getProfileStats(user.id),
        groupPostsService.getUserPosts(user.id),
        Promise.resolve(gamificationService.getAllBadges()),
        Promise.resolve(gamificationService.getUnlockedBadges(user.id)),
      ]);

      setProfileStats(stats);
      setPosts(userPosts || []);
      setBadges(allBadges);
      setUnlockedBadges(unlocked);
    } catch (error) {
      console.error("Erro ao carregar dados do perfil:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) return;

    setSaving(true);
    try {
      await profileService.updateProfile(user.id, { name: editedName.trim() });
      const updatedUser = { ...user, name: editedName.trim() };
      updateUser(updatedUser);

      toast({
        title: "Nome atualizado!",
        description: "Seu nome foi atualizado com sucesso.",
      });

      setIsEditing(false);
      // Recarregar stats
      const stats = await followService.getProfileStats(user.id);
      setProfileStats(stats);
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

  const handleSaveBio = async () => {
    if (!user) return;

    setSavingBio(true);
    try {
      await profileService.updateProfile(user.id, { bio: editedBio.trim() || undefined });
      
      toast({
        title: "Bio atualizada!",
        description: "Sua biografia foi atualizada com sucesso.",
      });

      setIsEditingBio(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a bio.",
        variant: "destructive",
      });
    } finally {
      setSavingBio(false);
    }
  };

  const loadFollowers = async () => {
    if (!user || !supabase) return;
    
    try {
      const { data: follows, error } = await supabase
        .from('user_follows')
        .select('follower_id, created_at')
        .eq('following_id', user.id.toString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const followerIds = follows?.map(f => f.follower_id) || [];
      if (followerIds.length === 0) {
        setFollowers([]);
        return;
      }

      const followersPromises = followerIds.map(async (id) => {
        try {
          const { data: stats } = await supabase
            .from('user_profile_stats')
            .select('user_id, user_name, avatar_url')
            .eq('user_id', id.toString())
            .maybeSingle();

          return {
            id: id,
            name: stats?.user_name || 'Usuário',
            avatar_url: stats?.avatar_url,
          };
        } catch {
          return {
            id: id,
            name: 'Usuário',
            avatar_url: undefined,
          };
        }
      });

      const followersData = await Promise.all(followersPromises);
      setFollowers(followersData);
    } catch (error) {
      console.error("Erro ao carregar seguidores:", error);
      setFollowers([]);
    }
  };

  const loadFollowing = async () => {
    if (!user || !supabase) return;
    
    try {
      const { data: follows, error } = await supabase
        .from('user_follows')
        .select('following_id, created_at')
        .eq('follower_id', user.id.toString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const followingIds = follows?.map(f => f.following_id) || [];
      if (followingIds.length === 0) {
        setFollowingList([]);
        return;
      }

      const followingPromises = followingIds.map(async (id) => {
        try {
          const { data: stats } = await supabase
            .from('user_profile_stats')
            .select('user_id, user_name, avatar_url')
            .eq('user_id', id.toString())
            .maybeSingle();

          return {
            id: id,
            name: stats?.user_name || 'Usuário',
            avatar_url: stats?.avatar_url,
          };
        } catch {
          return {
            id: id,
            name: 'Usuário',
            avatar_url: undefined,
          };
        }
      });

      const followingData = await Promise.all(followingPromises);
      setFollowingList(followingData);
    } catch (error) {
      console.error("Erro ao carregar seguindo:", error);
      setFollowingList([]);
    }
  };

  useEffect(() => {
    if (showFollowersDialog) {
      loadFollowers();
    }
  }, [showFollowersDialog, user]);

  useEffect(() => {
    if (showFollowingDialog) {
      loadFollowing();
    }
  }, [showFollowingDialog, user]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-muted-foreground text-sm">Carregando perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profileStats) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Carregando perfil...</p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header - Estilo Instagram */}
        <Card className="p-6 gradient-card border-border/50">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0 relative">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary/20">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
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

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="max-w-xs"
                        maxLength={50}
                      />
                      <Button
                        size="sm"
                        onClick={handleSaveName}
                        disabled={saving || !editedName.trim()}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {saving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditedName(user?.name || "");
                          setIsEditing(false);
                        }}
                        disabled={saving}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{user?.name}</h2>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setIsEditing(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mt-1">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Membro desde {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                    </span>
                  </div>
                  
                  {/* Bio */}
                  <div className="mt-3">
                    {isEditingBio ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editedBio}
                          onChange={(e) => setEditedBio(e.target.value)}
                          placeholder="Escreva uma biografia sobre você..."
                          className="min-h-[80px] resize-none"
                          maxLength={150}
                        />
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            {editedBio.length}/150 caracteres
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveBio}
                              disabled={savingBio}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              {savingBio ? "Salvando..." : "Salvar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await loadBio();
                                setIsEditingBio(false);
                              }}
                              disabled={savingBio}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-foreground/90 flex-1">
                          {editedBio || (
                            <span className="text-muted-foreground italic">
                              Nenhuma biografia ainda. Clique em editar para adicionar.
                            </span>
                          )}
                        </p>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 flex-shrink-0"
                          onClick={() => setIsEditingBio(true)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => setShowBadgesDialog(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Trophy className="h-4 w-4" />
                  Conquistas ({unlockedBadges.length})
                </Button>
              </div>

              {/* Stats - Estilo Instagram */}
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-xl font-bold">{profileStats.posts_count}</p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
                <button
                  onClick={() => setShowFollowersDialog(true)}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <p className="text-xl font-bold">{profileStats.followers_count}</p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </button>
                <button
                  onClick={() => setShowFollowingDialog(true)}
                  className="text-center hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <p className="text-xl font-bold">{profileStats.following_count}</p>
                  <p className="text-xs text-muted-foreground">Seguindo</p>
                </button>
                <div className="text-center">
                  <p className="text-xl font-bold">{profileStats.total_points}</p>
                  <p className="text-xs text-muted-foreground">Pontos</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Posts Grid - Estilo Instagram */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Grid3x3 className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Posts</h3>
          </div>
          
          {posts.length === 0 ? (
            <Card className="p-8 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-semibold mb-2">Nenhum post ainda</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Comece a compartilhar seus treinos!
              </p>
              <Button onClick={() => navigate("/feed")} variant="outline">
                Ver Feed
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    if (post.group_id) {
                      navigate(`/grupo/${post.group_id}`);
                    }
                  }}
                >
                  {post.photo_url ? (
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      <img
                        src={post.photo_url}
                        alt={post.title || "Post"}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="opacity-0 hover:opacity-100 transition-opacity text-white text-center p-4">
                          <p className="font-semibold">{post.title}</p>
                          {post.points && (
                            <p className="text-sm mt-1">{post.points} pts</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <div className="text-center p-4">
                        <p className="text-4xl mb-2">{post.mood_emoji || "💪"}</p>
                        <p className="font-semibold">{post.title}</p>
                        {post.points && (
                          <p className="text-sm text-muted-foreground mt-1">{post.points} pts</p>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog: Seguidores */}
      <Dialog open={showFollowersDialog} onOpenChange={setShowFollowersDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Seguidores</DialogTitle>
            <DialogDescription>
              {followers.length} {followers.length === 1 ? 'seguidor' : 'seguidores'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {followers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum seguidor ainda</p>
              </div>
            ) : (
              followers.map((follower) => (
                <button
                  key={follower.id}
                  onClick={() => {
                    navigate(`/perfil/${follower.id}`);
                    setShowFollowersDialog(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <ProfileAvatar
                    userId={follower.id}
                    userName={follower.name}
                    avatarUrl={follower.avatar_url}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{follower.name}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Seguindo */}
      <Dialog open={showFollowingDialog} onOpenChange={setShowFollowingDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Seguindo</DialogTitle>
            <DialogDescription>
              {followingList.length} {followingList.length === 1 ? 'pessoa' : 'pessoas'}
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {followingList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Não está seguindo ninguém ainda</p>
              </div>
            ) : (
              followingList.map((following) => (
                <button
                  key={following.id}
                  onClick={() => {
                    navigate(`/perfil/${following.id}`);
                    setShowFollowingDialog(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <ProfileAvatar
                    userId={following.id}
                    userName={following.name}
                    avatarUrl={following.avatar_url}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{following.name}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Conquistas */}
      <Dialog open={showBadgesDialog} onOpenChange={setShowBadgesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Suas Conquistas</DialogTitle>
            <DialogDescription>
              {unlockedBadges.length} de {badges.length} desbloqueadas ({Math.round((unlockedBadges.length / badges.length) * 100)}%)
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
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
                    <div className="text-center">
                      <span className="text-xs text-primary font-semibold">Desbloqueada</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

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
