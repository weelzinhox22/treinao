import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface RestTimerProps {
  exerciseName?: string;
  onComplete?: () => void;
}

const PRESET_TIMES = [30, 60, 90, 120, 180]; // segundos

const RestTimer = ({ exerciseName, onComplete }: RestTimerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // segundos
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTime, setSelectedTime] = useState(60);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playSound();
            toast({
              title: "Descanso finalizado!",
              description: exerciseName ? `Hora de continuar: ${exerciseName}` : "Hora de continuar o treino!",
            });
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, exerciseName, onComplete, toast]);

  const playSound = () => {
    try {
      // Criar um beep simples usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error("Erro ao tocar som:", error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    setSelectedTime(seconds);
    setIsRunning(true);
    setIsOpen(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resumeTimer = () => {
    setIsRunning(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedTime);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedTime);
    setIsOpen(false);
  };

  const progress = (selectedTime - timeLeft) / selectedTime;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Timer className="h-4 w-4" />
        Timer
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Timer de Descanso
            </DialogTitle>
            <DialogDescription>
              {exerciseName ? `Descanso para: ${exerciseName}` : "Configure seu tempo de descanso"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Timer Display */}
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative w-48 h-48 flex items-center justify-center">
                {/* Progress Circle */}
                <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - progress)}`}
                    className="text-primary transition-all duration-1000"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="relative z-10 text-center">
                  <div className="text-5xl font-bold text-primary">
                    {formatTime(timeLeft)}
                  </div>
                  {isRunning && (
                    <p className="text-sm text-muted-foreground mt-2">Descansando...</p>
                  )}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2">
              {!isRunning && timeLeft === selectedTime ? (
                <>
                  {PRESET_TIMES.map((time) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedTime(time);
                        setTimeLeft(time);
                      }}
                    >
                      {time}s
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const custom = prompt("Tempo personalizado (segundos):", "90");
                      if (custom) {
                        const seconds = parseInt(custom);
                        if (seconds > 0) {
                          setSelectedTime(seconds);
                          setTimeLeft(seconds);
                        }
                      }
                    }}
                  >
                    Custom
                  </Button>
                </>
              ) : (
                <>
                  {isRunning ? (
                    <Button onClick={pauseTimer} variant="outline" size="lg" className="gap-2">
                      <Pause className="h-4 w-4" />
                      Pausar
                    </Button>
                  ) : (
                    <Button onClick={resumeTimer} variant="default" size="lg" className="gap-2">
                      <Play className="h-4 w-4" />
                      Continuar
                    </Button>
                  )}
                  <Button onClick={resetTimer} variant="outline" size="lg" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Resetar
                  </Button>
                  <Button onClick={stopTimer} variant="ghost" size="lg">
                    Parar
                  </Button>
                </>
              )}
            </div>

            {/* Start Button */}
            {!isRunning && timeLeft === selectedTime && (
              <Button
                onClick={() => setIsRunning(true)}
                className="w-full"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                Iniciar Timer
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RestTimer;

