import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/notificationService";

export const useMobileNotification = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Verificar se já mostrou a notificação
    const notificationKey = `mobile_notification_shown_${user.id}`;
    const hasShown = localStorage.getItem(notificationKey);

    if (hasShown) return;

    // Verificar se é mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      // Criar notificação sobre uso no celular
      notificationService.createNotification(
        user.id,
        "admin",
        "📱 Use no Celular!",
        "Você pode instalar o app no seu celular para uma experiência melhor! Procure o botão 'Instalar' na dashboard.",
        {
          action: "install_pwa",
          shown_at: new Date().toISOString(),
        }
      ).then(() => {
        // Marcar como mostrado
        localStorage.setItem(notificationKey, "true");
      }).catch((error) => {
        console.error("Erro ao criar notificação mobile:", error);
      });
    }
  }, [user]);
};

