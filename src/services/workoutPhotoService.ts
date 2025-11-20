// Serviço para upload de fotos de treinos
import { supabase } from "@/config/supabase";
import { supabaseService } from "./supabaseService";

export const workoutPhotoService = {
  uploadWorkoutPhoto: async (userId: string, file: File): Promise<string> => {
    if (!supabaseService.isConfigured() || !supabase) {
      throw new Error("Supabase não configurado");
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
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/workouts/${Date.now()}.${fileExt}`;

      // Upload para Supabase Storage (bucket 'workout-photos')
      const { data, error } = await supabase.storage
        .from("workout-photos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Obter URL pública
      const {
        data: { publicUrl },
      } = supabase.storage.from("workout-photos").getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error("Erro ao fazer upload da foto do treino:", error);
      throw error;
    }
  },
};

