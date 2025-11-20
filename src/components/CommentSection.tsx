import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2 } from "lucide-react";
import { groupPostsService, type PostComment } from "@/services/groupPostsService";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import ProfileAvatar from "@/components/ProfileAvatar";

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
  currentUserName: string;
  onCommentAdded: () => void;
  onCommentDeleted: () => void;
}

const CommentSection = ({
  postId,
  currentUserId,
  currentUserName,
  onCommentAdded,
  onCommentDeleted,
}: CommentSectionProps) => {
  const { toast } = useToast();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      const data = await groupPostsService.getComments(postId);
      setComments(data);
    } catch (error) {
      console.error("Erro ao carregar comentários:", error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const comment = await groupPostsService.addComment(
        postId,
        currentUserId,
        currentUserName,
        undefined,
        newComment.trim()
      );
      setComments([...comments, comment]);
      setNewComment("");
      onCommentAdded();
    } catch (error) {
      console.error("Erro ao comentar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar comentário.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await groupPostsService.deleteComment(commentId);
      setComments(comments.filter((c) => c.id !== commentId));
      onCommentDeleted();
      toast({
        title: "Comentário deletado",
      });
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar comentário.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-t border-border/50 p-4 space-y-4 bg-muted/20">
      {/* Lista de Comentários */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
            <ProfileAvatar
              userId={comment.user_id}
              userName={comment.user_name}
              size="sm"
            />
            
            <div className="flex-1">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{comment.user_name}</p>
                  {comment.user_id === currentUserId && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1 ml-3">
                {formatDistanceToNow(new Date(comment.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nenhum comentário ainda. Seja o primeiro!
          </p>
        )}
      </div>

      {/* Adicionar Comentário */}
      <div className="flex gap-2">
        <Input
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleAddComment()}
          disabled={loading}
        />
        <Button
          size="icon"
          onClick={handleAddComment}
          disabled={!newComment.trim() || loading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default CommentSection;

