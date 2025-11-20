// Serviço para gerenciar perfil do usuário (foto de perfil)
// ⚠️ SEGURANÇA: Conectado ao Supabase Storage com fallback para localStorage

import { supabase } from "@/config/supabase";
import { supabaseService } from "./supabaseService";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

const PROFILE_KEY = "user_profile";

// Obter perfil do localStorage
const getProfileFromStorage = (userId: string): UserProfile | null => {
  try {
    const stored = localStorage.getItem(`${PROFILE_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Salvar perfil no localStorage
const saveProfileToStorage = (profile: UserProfile): void => {
  try {
    localStorage.setItem(`${PROFILE_KEY}_${profile.id}`, JSON.stringify(profile));
  } catch {
    console.error("Erro ao salvar perfil");
  }
};

export const profileService = {
  // Upload de foto de perfil
  uploadAvatar: async (userId: string, file: File): Promise<string> => {
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
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("Arquivo muito grande. Máximo 5MB");
      }

      if (!file.type.startsWith("image/")) {
        throw new Error("Arquivo deve ser uma imagem");
      }

      // Verificar se o bucket existe
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      if (bucketsError) {
        console.error("Erro ao listar buckets:", bucketsError);
      }
      
      const avatarsBucket = buckets?.find(b => b.name === "avatars");
      if (!avatarsBucket) {
        throw new Error("Bucket 'avatars' não encontrado. Configure o Storage no Supabase (veja CONFIGURACAO_STORAGE.md)");
      }

      // Deletar avatar antigo se existir
      const currentProfile = await profileService.getProfile(userId);
      if (currentProfile?.avatar_url && currentProfile.avatar_url.includes("supabase.co")) {
        try {
          const urlParts = currentProfile.avatar_url.split("/");
          const oldFileName = urlParts.slice(urlParts.indexOf("avatars") + 1).join("/");
          await supabase.storage.from("avatars").remove([oldFileName]);
        } catch (error) {
          console.warn("Erro ao deletar avatar antigo:", error);
          // Continuar mesmo se não conseguir deletar
        }
      }

      // Criar nome único para o arquivo
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatars")
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
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      if (!publicUrl) {
        throw new Error("Não foi possível obter URL pública da imagem");
      }

      // Atualizar perfil do usuário
      await profileService.updateProfile(userId, { avatar_url: publicUrl });

      return publicUrl;
    } catch (error: any) {
      console.error("Erro ao fazer upload da foto:", error);
      throw error;
    }
  },

  // Obter perfil do usuário
  getProfile: async (userId: string): Promise<UserProfile | null> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (!error && data) {
          const profile: UserProfile = {
            id: data.id,
            name: data.name,
            email: data.email,
            avatar_url: data.avatar_url,
            bio: data.bio,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          saveProfileToStorage(profile);
          return profile;
        }
      } catch (error) {
        console.error("Erro ao buscar perfil do Supabase:", error);
      }
    }

    // Fallback para localStorage
    return getProfileFromStorage(userId);
  },

  // Atualizar perfil
  updateProfile: async (
    userId: string,
    updates: Partial<Omit<UserProfile, "id" | "created_at">>
  ): Promise<UserProfile> => {
    const currentProfile = getProfileFromStorage(userId) || {
      id: userId,
      name: "",
      email: "",
    };

    const updatedProfile: UserProfile = {
      ...currentProfile,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Salvar no Supabase
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from("users")
          .update({
            avatar_url: updatedProfile.avatar_url,
            bio: updatedProfile.bio,
            updated_at: updatedProfile.updated_at,
          })
          .eq("id", userId);

        if (error) throw error;
      } catch (error) {
        console.error("Erro ao atualizar perfil no Supabase:", error);
      }
    }

    // Sempre salvar localmente também
    saveProfileToStorage(updatedProfile);

    return updatedProfile;
  },

  // Deletar foto de perfil
  deleteAvatar: async (userId: string): Promise<void> => {
    const profile = getProfileFromStorage(userId);
    if (!profile?.avatar_url) return;

    // Se for URL do Supabase Storage, deletar do storage
    if (supabaseService.isConfigured() && supabase && profile.avatar_url.includes("supabase.co")) {
      try {
        // Extrair caminho do arquivo da URL
        const urlParts = profile.avatar_url.split("/");
        const fileName = urlParts.slice(urlParts.indexOf("avatars") + 1).join("/");

        await supabase.storage.from("avatars").remove([fileName]);
      } catch (error) {
        console.error("Erro ao deletar foto do storage:", error);
      }
    }

    // Remover do perfil
    await profileService.updateProfile(userId, { avatar_url: undefined });
  },
};

