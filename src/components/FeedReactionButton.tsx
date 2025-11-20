import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Smile } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedReactionButtonProps {
  type: "shared_treino" | "quick_workout";
  itemId: string;
  currentUserId: string;
  currentUserName: string;
  onReactionAdded?: () => void;
  onAddReaction: (itemId: string, userId: string, userName: string, emoji: string) => Promise<void>;
}

const FeedReactionButton = ({ 
  type, 
  itemId, 
  currentUserId, 
  currentUserName, 
  onReactionAdded,
  onAddReaction 
}: FeedReactionButtonProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  // Reações rápidas - frango primeiro! 🐔
  const reactions = ["🐔", "🔥", "💪", "👏", "😍", "💯", "🎉", "🏆"];

  const handleReaction = async (emoji: string) => {
    try {
      await onAddReaction(itemId, currentUserId, currentUserName, emoji);
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
        <div className="flex gap-1 flex-wrap">
          {reactions.map((emoji, index) => (
            <Button
              key={`${emoji}-${index}`}
              variant="ghost"
              size="sm"
              className="text-2xl hover:scale-125 transition-transform p-2"
              onClick={() => handleReaction(emoji)}
              title={emoji === "🐔" ? "Frango! 🐔" : emoji}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default FeedReactionButton;

