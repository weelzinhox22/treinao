import { useEffect } from "react";
import confetti from "canvas-confetti";

interface ConfettiProps {
  trigger: boolean;
  options?: {
    startVelocity?: number;
    spread?: number;
    ticks?: number;
    zIndex?: number;
    particleCount?: number;
    origin?: { x: number; y: number };
  };
}

const Confetti = ({ trigger, options }: ConfettiProps) => {
  useEffect(() => {
    if (trigger) {
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = {
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
        ...options,
      };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: NodeJS.Timeout = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);
    }
  }, [trigger, options]);

  return null;
};

export default Confetti;

