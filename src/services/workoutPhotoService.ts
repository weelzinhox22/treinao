// Serviço para upload de fotos de treinos
import { supabase } from "@/config/supabase";
import { supabaseService } from "./supabaseService";

export const workoutPhotoService = {
  uploadWorkoutPhoto: async (userId: string, file: File): Promise<string> => {
    if (!supabaseService.isConfigured() || !supabase) {
      throw new Error("Supabase não configurado. Configure as variáveis de ambiente.");
    }

    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== userId) {
      throw new Error("Usuário não autenticado");
    }

    try {
      // Validar arquivo
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("Arquivo muito grande. Máximo 10MB");
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("Arquivo deve ser uma imagem");
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${userId}/workouts/${Date.now()}.${fileExt}`;

      // Upload para Supabase Storage (bucket 'workout-photos')
      const { data, error } = await supabase.storage
        .from("workout-photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Erro no upload:", error);
        throw new Error(`Erro ao fazer upload: ${error.message}`);
      }

      if (!data) {
        throw new Error("Upload falhou sem retornar dados");
      }

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("workout-photos").getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error("Não foi possível obter URL pública da imagem");
      }

      return publicUrl;
    } catch (error: any) {
      console.error("Erro ao fazer upload da foto do treino:", error);
      throw error;
    }
  },
};

