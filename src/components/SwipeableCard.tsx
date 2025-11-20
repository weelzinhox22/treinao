import { useState, useRef, useEffect, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  className?: string;
}

const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  className,
}: SwipeableCardProps) => {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentX(e.touches[0].clientX - startX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;

    const diff = currentX;

    if (diff < -swipeThreshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (diff > swipeThreshold && onSwipeRight) {
      onSwipeRight();
    }

    setCurrentX(0);
    setIsDragging(false);
  };

  useEffect(() => {
    if (!isDragging) {
      setCurrentX(0);
    }
  }, [isDragging]);

  return (
    <Card
      ref={cardRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={cn(
        "transition-transform duration-200 touch-none",
        isDragging && "transition-none",
        className
      )}
      style={{
        transform: `translateX(${currentX}px)`,
        opacity: isDragging ? 1 - Math.abs(currentX) / 200 : 1,
      }}
    >
      {children}
    </Card>
  );
};

export default SwipeableCard;

