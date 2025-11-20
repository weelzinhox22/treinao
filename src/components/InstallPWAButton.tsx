import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWAButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Verificar se está em iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      // Em iOS, não há evento beforeinstallprompt
      return;
    }

    // Escutar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Se não há prompt, pode ser iOS ou já instalado
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        toast({
          title: "Instalar no iOS",
          description: "Toque no botão Compartilhar e depois em 'Adicionar à Tela de Início'",
        });
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: "Instalando...",
          description: "O app está sendo instalado. Obrigado!",
        });
        setDeferredPrompt(null);
        setIsInstalled(true);
      } else {
        toast({
          title: "Instalação cancelada",
          description: "Você pode instalar depois se quiser.",
        });
      }
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
      toast({
        title: "Erro",
        description: "Não foi possível instalar o app.",
        variant: "destructive",
      });
    }
  };

  if (isInstalled) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <Check className="h-4 w-4" />
        Instalado
      </Button>
    );
  }

  if (!deferredPrompt) {
    return null; // Não mostrar se não há prompt disponível
  }

  return (
    <Button onClick={handleInstall} className="gap-2">
      <Download className="h-4 w-4" />
      Instalar App
    </Button>
  );
};

export default InstallPWAButton;

