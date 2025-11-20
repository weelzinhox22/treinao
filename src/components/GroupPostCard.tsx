import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MoreVertical,
  Heart,
  MessageCircle,
  Clock,
  TrendingUp,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { groupPostsService, type GroupPost } from "@/services/groupPostsService";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import CommentSection from "./CommentSection";
import ReactionButton from "./ReactionButton";

interface GroupPostCardProps {
  post: GroupPost;
  currentUserId: string;
  currentUserName: string;
  onDelete: (postId: string) => void;
}

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

const GroupPostCard = ({ post, currentUserId, currentUserName, onDelete }: GroupPostCardProps) => {
  const { toast } = useToast();
  const [liked, setLiked] = useState(post.user_liked || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [showComments, setShowComments] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [likeUsers, setLikeUsers] = useState<string[]>([]);

  const workoutTypeIcons: Record<string, string> = {
    musculacao: "🏋️",
    cardio: "🏃",
    yoga: "🧘",
    outro: "⚡",
  };

  useEffect(() => {
    loadReactions();
    loadLikes();
  }, [post.id]);

  const loadReactions = async () => {
    try {
      const reactionsData = await groupPostsService.getReactions(post.id);
      
      // Agrupar reações por emoji
      const grouped = reactionsData.reduce((acc: Record<string, { emoji: string; count: number; users: string[] }>, reaction) => {
        if (!acc[reaction.emoji]) {
          acc[reaction.emoji] = {
            emoji: reaction.emoji,
            count: 0,
            users: [],
          };
        }
        acc[reaction.emoji].count++;
        acc[reaction.emoji].users.push(reaction.user_name);
        return acc;
      }, {});

      setReactions(Object.values(grouped));
    } catch (error) {
      console.error("Erro ao carregar reações:", error);
    }
  };

  const loadLikes = async () => {
    try {
      const likes = await groupPostsService.getLikes(post.id);
      setLikeUsers(likes.map((l) => l.user_name));
    } catch (error) {
      console.error("Erro ao carregar curtidas:", error);
    }
  };

  const handleLike = async () => {
    try {
      if (liked) {
        await groupPostsService.unlikePost(post.id, currentUserId);
        setLiked(false);
        setLikesCount(likesCount - 1);
      } else {
        await groupPostsService.likePost(post.id, currentUserId, currentUserName);
        setLiked(true);
        setLikesCount(likesCount + 1);
      }
      
      // Atualizar lista de quem curtiu
      loadLikes();
    } catch (error) {
      console.error("Erro ao curtir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível curtir o post.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await groupPostsService.deletePost(post.id);
      onDelete(post.id);
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o post.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="overflow-hidden gradient-card border-border/50 shadow-card hover:shadow-glow transition-smooth">
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.user_avatar_url} />
            <AvatarFallback>{post.user_name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">{post.user_name}</p>
            <p className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(post.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
        </div>

        {post.user_id === currentUserId && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Conteúdo */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 mb-2">
          {post.mood_emoji && (
            <span className="text-2xl">{post.mood_emoji}</span>
          )}
          <h3 className="text-xl font-bold">{post.title}</h3>
        </div>
        
        {post.description && (
          <p className="text-muted-foreground mb-3">{post.description}</p>
        )}

        {/* Foto */}
        {post.photo_url && (
          <img
            src={post.photo_url}
            alt={post.title}
            className="w-full rounded-lg mb-3 max-h-96 object-cover"
          />
        )}

        {/* Info do Treino */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4 text-primary" />
            <span>{post.duration_minutes} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg">{workoutTypeIcons[post.workout_type]}</span>
            <span className="capitalize">{post.workout_type}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-yellow-500" />
            <span>{post.points} pts</span>
          </div>
        </div>
      </div>

      {/* Reações e Stats */}
      <div className="px-4 py-2 border-t border-border/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            {/* Curtidas */}
            {likesCount > 0 && (
              <div 
                className="flex items-center gap-1.5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                title={likeUsers.length > 0 ? likeUsers.join(", ") : ""}
              >
                <Heart className="h-4 w-4 text-red-500 fill-current" />
                <span>{likesCount}</span>
              </div>
            )}
            
            {/* Reações com Emoji */}
            {reactions.length > 0 && (
              <div className="flex items-center gap-1">
                {reactions.map((reaction, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1 hover:bg-muted transition-colors cursor-pointer"
                    title={reaction.users.join(", ")}
                  >
                    <span className="text-base">{reaction.emoji}</span>
                    <span className="text-xs text-muted-foreground">{reaction.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comentários */}
          {commentsCount > 0 && (
            <button
              onClick={() => setShowComments(!showComments)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {commentsCount} {commentsCount === 1 ? "comentário" : "comentários"}
            </button>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="px-4 py-2 border-t border-border/50 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          className={`gap-2 flex-1 ${liked ? "text-red-500" : ""}`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
          {liked ? "Curtido" : "Curtir"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowComments(!showComments)}
          className="gap-2 flex-1"
        >
          <MessageCircle className="h-4 w-4" />
          Comentar
        </Button>

        <ReactionButton 
          postId={post.id} 
          currentUserId={currentUserId} 
          currentUserName={currentUserName}
          onReactionAdded={loadReactions}
        />
      </div>

      {/* Comentários */}
      {showComments && (
        <CommentSection
          postId={post.id}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          onCommentAdded={() => setCommentsCount(commentsCount + 1)}
          onCommentDeleted={() => setCommentsCount(Math.max(0, commentsCount - 1))}
        />
      )}
    </Card>
  );
};

export default GroupPostCard;

