import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  UserPlus,
  UserMinus,
  Users,
  Grid3x3,
  Trophy,
  TrendingUp,
  Calendar,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { followService, type UserProfileStats } from "@/services/followService";
import { groupPostsService, type GroupPost } from "@/services/groupPostsService";
import { profileService } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import GroupPostCard from "@/components/GroupPostCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProfileAvatar from "@/components/ProfileAvatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/config/supabase";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileStats, setProfileStats] = useState<UserProfileStats | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [showFollowersDialog, setShowFollowersDialog] = useState(false);
  const [showFollowingDialog, setShowFollowingDialog] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);
  const [followingList, setFollowingList] = useState<any[]>([]);
  const [bio, setBio] = useState<string>("");

  const isOwnProfile = user?.id === userId;

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId, user]);

  const loadProfile = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const [stats, userPosts, followingStatus, profile] = await Promise.all([
        followService.getProfileStats(userId),
        groupPostsService.getUserPosts(userId),
        user && !isOwnProfile
          ? followService.isFollowing(user.id, userId)
          : Promise.resolve(false),
        profileService.getProfile(userId),
      ]);

      setProfileStats(stats);
      setPosts(userPosts || []);
      setIsFollowing(followingStatus);
      setBio(profile?.bio || "");
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o perfil.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !userId || isOwnProfile) return;

    setFollowing(true);
    try {
      if (isFollowing) {
        await followService.unfollowUser(user.id, userId);
        setIsFollowing(false);
        toast({
          title: "Deixou de seguir",
          description: `Você não está mais seguindo ${profileStats?.user_name}`,
        });
      } else {
        await followService.followUser(user.id, userId);
        setIsFollowing(true);
        toast({
          title: "Seguindo!",
          description: `Você está seguindo ${profileStats?.user_name}`,
        });
      }
      // Recarregar stats para atualizar contador
      const stats = await followService.getProfileStats(userId);
      setProfileStats(stats);
    } catch (error: any) {
      console.error("Erro ao seguir/deixar de seguir:", error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível seguir/deixar de seguir.",
        variant: "destructive",
      });
    } finally {
      setFollowing(false);
    }
  };

  const loadFollowers = async () => {
    if (!userId || !supabase) return;
    
    try {
      const { data: follows, error } = await supabase
        .from('user_follows')
        .select('follower_id, created_at')
        .eq('following_id', userId.toString())
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
    if (!userId || !supabase) return;
    
    try {
      const { data: follows, error } = await supabase
        .from('user_follows')
        .select('following_id, created_at')
        .eq('follower_id', userId.toString())
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
    if (showFollowersDialog && userId) {
      loadFollowers();
    }
  }, [showFollowersDialog, userId]);

  useEffect(() => {
    if (showFollowingDialog && userId) {
      loadFollowing();
    }
  }, [showFollowingDialog, userId]);

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
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Perfil não encontrado</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Este usuário não existe ou não foi encontrado.
            </p>
            <Button onClick={() => navigate(-1)} variant="outline">
              Voltar
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 pb-20 md:pb-8 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Perfil</h1>
        </div>

        {/* Profile Header */}
        <Card className="p-6 gradient-card border-border/50">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary/20">
                <AvatarImage src={profileStats.avatar_url} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {profileStats.user_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1">{profileStats.user_name}</h2>
                  <p className="text-muted-foreground text-sm mb-2">@{userId.slice(0, 8)}</p>
                  {bio && (
                    <p className="text-sm text-foreground/90 mt-2">{bio}</p>
                  )}
                </div>
                {!isOwnProfile && user && (
                  <Button
                    onClick={handleFollow}
                    disabled={following}
                    variant={isFollowing ? "outline" : "default"}
                    className="gap-2"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinus className="h-4 w-4" />
                        Seguindo
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Seguir
                      </>
                    )}
                  </Button>
                )}
                {isOwnProfile && (
                  <Button asChild variant="outline">
                    <Link to="/perfil">Editar Perfil</Link>
                  </Button>
                )}
              </div>

              {/* Stats */}
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

        {/* Posts Grid */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="posts" className="gap-2">
              <Grid3x3 className="h-4 w-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Estatísticas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            {posts.length === 0 ? (
              <Card className="p-8 text-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">Nenhum post ainda</h3>
                <p className="text-muted-foreground text-sm">
                  {isOwnProfile
                    ? "Comece a compartilhar seus treinos!"
                    : "Este usuário ainda não compartilhou nenhum treino."}
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => {
                      // Navegar para o grupo do post se tiver group_id
                      if (post.group_id) {
                        navigate(`/grupo/${post.group_id}`);
                      }
                    }}
                  >
                    {post.photo_url && (
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
                    )}
                    {!post.photo_url && (
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
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{profileStats.total_points}</p>
                <p className="text-xs text-muted-foreground">Pontos Totais</p>
              </Card>
              <Card className="p-4 text-center">
                <Grid3x3 className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{profileStats.posts_count}</p>
                <p className="text-xs text-muted-foreground">Posts</p>
              </Card>
              <Card className="p-4 text-center">
                <Users className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{profileStats.followers_count}</p>
                <p className="text-xs text-muted-foreground">Seguidores</p>
              </Card>
              <Card className="p-4 text-center">
                <UserPlus className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold">{profileStats.following_count}</p>
                <p className="text-xs text-muted-foreground">Seguindo</p>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
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
    </div>
  );
};

export default UserProfile;

