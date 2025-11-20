import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const onboardingSteps = [
  {
    title: "Bem-vindo ao TREINÃO DOS CARAS!",
    description: "A plataforma completa para acompanhar seus treinos e evolução.",
    action: "Vamos começar!",
  },
  {
    title: "Registre Seus Treinos",
    description: "Adicione exercícios, séries, repetições e cargas. Use templates para começar rápido!",
    action: "Próximo",
    route: "/treinos/novo",
  },
  {
    title: "Acompanhe Sua Progressão",
    description: "Veja gráficos detalhados da sua evolução em cada exercício.",
    action: "Próximo",
    route: "/progressao",
  },
  {
    title: "Defina Metas",
    description: "Crie objetivos e acompanhe seu progresso para se manter motivado.",
    action: "Próximo",
    route: "/metas",
  },
  {
    title: "Desbloqueie Conquistas",
    description: "Ganhe badges ao completar treinos, bater recordes e alcançar metas!",
    action: "Começar agora!",
    route: "/badges",
  },
];

const Onboarding = () => {
  const { isCompleted, currentStep, setCurrentStep, completeOnboarding } = useOnboarding();
  const navigate = useNavigate();
  const [show, setShow] = useState(!isCompleted);

  if (!show || isCompleted) return null;

  const step = onboardingSteps[currentStep];
  const isLast = currentStep === onboardingSteps.length - 1;
  const isFirst = currentStep === 0;

  const handleNext = () => {
    if (isLast) {
      completeOnboarding();
      setShow(false);
      if (step.route) {
        navigate(step.route);
      }
    } else {
      setCurrentStep(currentStep + 1);
      if (step.route) {
        navigate(step.route);
      }
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    setShow(false);
  };

  const handlePrevious = () => {
    if (!isFirst) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <Card className="max-w-md w-full p-6 gradient-card border-border/50 shadow-card relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSkip}
          className="absolute top-2 right-2 h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
            <p className="text-muted-foreground text-sm">{step.description}</p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Passo {currentStep + 1} de {onboardingSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / onboardingSteps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-background rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / onboardingSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!isFirst && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="flex-1"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
            )}
            <Button
              onClick={handleNext}
              className={cn("flex-1", !isFirst && "flex-1")}
            >
              {step.action}
              {!isLast && <ArrowRight className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;

