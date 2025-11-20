import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Trophy } from "lucide-react";
import { type Badge } from "@/services/gamificationService";
import Confetti from "./Confetti";
import { cn } from "@/lib/utils";

interface BadgeNotificationProps {
  badge: Badge;
  onClose: () => void;
}

const BadgeNotification = ({ badge, onClose }: BadgeNotificationProps) => {
  const [show, setShow] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClose = () => {
    setShow(false);
    setTimeout(onClose, 300);
  };

  const rarityColors = {
    common: "border-gray-500 bg-gray-500/10",
    rare: "border-blue-500 bg-blue-500/10",
    epic: "border-purple-500 bg-purple-500/10",
    legendary: "border-yellow-500 bg-yellow-500/10",
  };

  return (
    <>
      <Confetti trigger={showConfetti} />
      <div
        className={cn(
          "fixed top-20 right-4 z-50 transition-all duration-300",
          show ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
        )}
      >
        <Card
          className={cn(
            "p-4 shadow-lg border-2 min-w-[300px]",
            rarityColors[badge.rarity]
          )}
        >
          <div className="flex items-start gap-3">
            <div className="text-4xl">{badge.icon}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <h3 className="font-bold text-sm">Conquista Desbloqueada!</h3>
              </div>
              <p className="font-semibold text-sm mb-1">{badge.name}</p>
              <p className="text-xs text-muted-foreground">{badge.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default BadgeNotification;

