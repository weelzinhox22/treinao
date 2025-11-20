import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { groupPostsService } from "@/services/groupPostsService";
import { useToast } from "@/hooks/use-toast";

interface ReactionButtonProps {
  postId: string;
  currentUserId: string;
  currentUserName: string;
  onReactionAdded?: () => void;
}

const ReactionButton = ({ postId, currentUserId, currentUserName, onReactionAdded }: ReactionButtonProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const reactions = ["🔥", "💪", "👏", "😍", "💯", "🎉"];

  const handleReaction = async (emoji: string) => {
    try {
      await groupPostsService.addReaction(postId, currentUserId, currentUserName, emoji);
      setOpen(false);
      toast({
        title: "Reação adicionada!",
        description: `Você reagiu com ${emoji}`,
      });
      
      // Chamar callback para atualizar as reações no componente pai
      if (onReactionAdded) {
        onReactionAdded();
      }
    } catch (error) {
      console.error("Erro ao reagir:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar reação.",
        variant: "destructive",
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Smile className="h-4 w-4" />
          Reagir
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-1">
          {reactions.map((emoji) => (
            <Button
              key={emoji}
              variant="ghost"
              size="sm"
              className="text-2xl hover:scale-125 transition-transform"
              onClick={() => handleReaction(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ReactionButton;

