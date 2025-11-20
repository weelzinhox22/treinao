import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabaseService } from "@/services/supabaseService";
import { treinoService } from "@/services/treinoService";
import { fotoService } from "@/services/fotoService";
import { metasService } from "@/services/metasService";
import { gamificationService } from "@/services/gamificationService";
import { templatesService } from "@/services/templatesService";
import { useToast } from "@/hooks/use-toast";
import { Cloud, CloudOff, CheckCircle2 } from "lucide-react";

export const useSync = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");

  // Sincronizar todos os dados
  const syncAll = async () => {
    if (!user || !supabaseService.isConfigured()) return;

    setIsSyncing(true);
    setSyncStatus("syncing");

    try {
      // Sincronizar treinos
      const treinos = treinoService.getTreinos(user.id);
      if (treinos.length > 0) {
        await supabaseService.saveData("treinos", user.id, treinos);
      }

      // Sincronizar fotos
      const fotos = fotoService.getFotos(user.id);
      if (fotos.length > 0) {
        await supabaseService.saveData("fotos", user.id, fotos);
      }

      // Sincronizar metas
      const metas = metasService.getMetas(user.id);
      if (metas.length > 0) {
        await supabaseService.saveData("metas", user.id, metas);
      }

      // Sincronizar achievements
      const achievements = gamificationService.getAchievements(user.id);
      if (achievements.length > 0) {
        await supabaseService.saveData("achievements", user.id, achievements);
      }

      // Sincronizar templates
      const templates = templatesService.getTemplates(user.id).filter((t) => !t.isDefault);
      if (templates.length > 0) {
        await supabaseService.saveData("templates", user.id, templates);
      }

      // Sincronizar dados pendentes
      await supabaseService.syncPending();

      setLastSync(new Date());
      setSyncStatus("success");
      toast({
        title: "Sincronização concluída",
        description: "Seus dados foram sincronizados com sucesso.",
      });

      // Resetar status após 3 segundos
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      setSyncStatus("error");
      toast({
        title: "Erro na sincronização",
        description: "Não foi possível sincronizar seus dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Sincronização automática quando voltar online
  useEffect(() => {
    if (!user || !supabaseService.isConfigured()) return;

    const handleOnline = () => {
      syncAll();
    };

    window.addEventListener("online", handleOnline);

    // Sincronizar ao montar se estiver online
    if (supabaseService.getIsOnline()) {
      syncAll();
    }

    // Sincronizar periodicamente (a cada 5 minutos)
    const interval = setInterval(() => {
      if (supabaseService.getIsOnline()) {
        syncAll();
      }
    }, 5 * 60 * 1000);

    return () => {
      window.removeEventListener("online", handleOnline);
      clearInterval(interval);
    };
  }, [user]);

  return {
    isSyncing,
    lastSync,
    syncStatus,
    syncAll,
    isOnline: supabaseService.getIsOnline(),
  };
};

