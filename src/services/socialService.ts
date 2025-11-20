// Serviço para funcionalidades sociais (compartilhamento e comunidade)
// ⚠️ SEGURANÇA: Conectado ao Supabase com fallback para localStorage

import { supabase } from "@/config/supabase";
import { supabaseService } from "./supabaseService";

export interface SharedTreino {
  id: string;
  treinoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  isPublic: boolean;
  isAnonymous: boolean;
  likes: number;
  comments: number;
  sharedAt: string;
  tags?: string[];
  treinoData?: {
    name: string;
    exercises: Array<{ name: string; sets: number; reps: number; weight: number }>;
    totalVolume: number;
    date: string;
  };
}

export interface TreinoComment {
  id: string;
  sharedTreinoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  comment: string;
  createdAt: string;
}

const SHARED_TREINOS_KEY = "shared_treinos";
const COMMENTS_KEY = "treino_comments";
const LIKES_KEY = "treino_likes";

// Obter treinos compartilhados do storage
const getSharedTreinosFromStorage = (): SharedTreino[] => {
  try {
    const stored = localStorage.getItem(SHARED_TREINOS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Salvar treinos compartilhados
const saveSharedTreinosToStorage = (shared: SharedTreino[]): void => {
  try {
    localStorage.setItem(SHARED_TREINOS_KEY, JSON.stringify(shared));
  } catch {
    console.error("Erro ao salvar treinos compartilhados");
  }
};

// Obter comentários
const getCommentsFromStorage = (): TreinoComment[] => {
  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Salvar comentários
const saveCommentsToStorage = (comments: TreinoComment[]): void => {
  try {
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(comments));
  } catch {
    console.error("Erro ao salvar comentários");
  }
};

// Obter likes
const getLikesFromStorage = (): Record<string, string[]> => {
  try {
    const stored = localStorage.getItem(LIKES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

// Salvar likes
const saveLikesToStorage = (likes: Record<string, string[]>): void => {
  try {
    localStorage.setItem(LIKES_KEY, JSON.stringify(likes));
  } catch {
    console.error("Erro ao salvar likes");
  }
};

export const socialService = {
  // Compartilhar treino
  shareTreino: async (
    treinoId: string,
    userId: string,
    userName: string,
    treinoData?: {
      name: string;
      exercises: Array<{ name: string; sets: number; reps: number; weight: number }>;
      totalVolume: number;
      date: string;
    },
    options: {
      isPublic?: boolean;
      isAnonymous?: boolean;
      tags?: string[];
    } = {}
  ): Promise<SharedTreino> => {
    const shared: SharedTreino = {
      id: Date.now().toString(),
      treinoId,
      userId,
      userName: options.isAnonymous ? "Anônimo" : userName,
      isPublic: options.isPublic ?? true,
      isAnonymous: options.isAnonymous ?? false,
      likes: 0,
      comments: 0,
      sharedAt: new Date().toISOString(),
      tags: options.tags || [],
      treinoData, // Incluir dados do treino para exibição
    };

    // Salvar no Supabase (com fallback para localStorage)
    if (supabaseService.isConfigured() && supabase) {
      try {
        // Converter para formato do Supabase (snake_case)
        const supabaseData = {
          id: shared.id,
          treino_id: shared.treinoId,
          user_id: shared.userId,
          user_name: shared.userName,
          user_avatar: shared.userAvatar,
          is_public: shared.isPublic,
          is_anonymous: shared.isAnonymous,
          likes: shared.likes,
          comments: shared.comments,
          shared_at: shared.sharedAt,
          tags: shared.tags || [],
          treino_data: shared.treinoData,
        };

        const { error } = await supabase
          .from("shared_treinos")
          .insert(supabaseData);

        if (error) throw error;
      } catch (error) {
        console.error("Erro ao salvar no Supabase, usando localStorage:", error);
        const allShared = getSharedTreinosFromStorage();
        allShared.push(shared);
        saveSharedTreinosToStorage(allShared);
      }
    } else {
      const allShared = getSharedTreinosFromStorage();
      allShared.push(shared);
      saveSharedTreinosToStorage(allShared);
    }

    return shared;
  },

  // Obter feed de treinos (públicos)
  getFeed: async (limit: number = 20): Promise<SharedTreino[]> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        // Buscar do Supabase
        const { data, error } = await supabase
          .from("shared_treinos")
          .select("*")
          .eq("is_public", true)
          .order("shared_at", { ascending: false })
          .limit(limit);

        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            treinoId: item.treino_id,
            userId: item.user_id,
            userName: item.user_name,
            isPublic: item.is_public,
            isAnonymous: item.is_anonymous,
            likes: item.likes || 0,
            comments: item.comments || 0,
            sharedAt: item.shared_at,
            tags: item.tags || [],
            treinoData: item.treino_data,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar feed do Supabase:", error);
      }
    }

    // Fallback para localStorage
    const allShared = getSharedTreinosFromStorage();
    return allShared
      .filter((s) => s.isPublic)
      .sort((a, b) => new Date(b.sharedAt).getTime() - new Date(a.sharedAt).getTime())
      .slice(0, limit);
  },

  // Obter treinos compartilhados do usuário
  getUserSharedTreinos: (userId: string): SharedTreino[] => {
    const allShared = getSharedTreinosFromStorage();
    return allShared.filter((s) => s.userId === userId);
  },

  // Curtir treino
  likeTreino: async (sharedTreinoId: string, userId: string, userName?: string): Promise<boolean> => {
    // Verificar se já curtiu no Supabase
    if (supabaseService.isConfigured() && supabase) {
      try {
        // Buscar like existente
        const { data: existingLike } = await supabase
          .from("treino_likes")
          .select("id")
          .eq("shared_treino_id", sharedTreinoId)
          .eq("user_id", userId)
          .maybeSingle();

        if (existingLike) {
          // Descurtir - deletar do Supabase
          await supabase
            .from("treino_likes")
            .delete()
            .eq("id", existingLike.id);
          
          // Atualizar localStorage
          const likes = getLikesFromStorage();
          if (likes[sharedTreinoId]) {
            likes[sharedTreinoId] = likes[sharedTreinoId].filter((id) => id !== userId);
            saveLikesToStorage(likes);
          }
          
          return false;
        } else {
          // Curtir - inserir no Supabase
          // Buscar nome do usuário se não fornecido
          let finalUserName = userName;
          if (!finalUserName) {
            try {
              const { data: userData } = await supabase
                .from("users")
                .select("name")
                .eq("id", userId)
                .single();
              finalUserName = userData?.name || "Alguém";
            } catch {
              finalUserName = "Alguém";
            }
          }

          await supabase
            .from("treino_likes")
            .insert({
              shared_treino_id: sharedTreinoId,
              user_id: userId,
              user_name: finalUserName,
            });
          
          // Atualizar localStorage
          const likes = getLikesFromStorage();
          if (!likes[sharedTreinoId]) {
            likes[sharedTreinoId] = [];
          }
          if (!likes[sharedTreinoId].includes(userId)) {
            likes[sharedTreinoId].push(userId);
            saveLikesToStorage(likes);
          }
          
          return true;
        }
      } catch (error) {
        console.error("Erro ao curtir/descurtir no Supabase:", error);
        // Fallback para localStorage
      }
    }

    // Fallback para localStorage
    const likes = getLikesFromStorage();
    if (!likes[sharedTreinoId]) {
      likes[sharedTreinoId] = [];
    }

    const hasLiked = likes[sharedTreinoId].includes(userId);
    if (hasLiked) {
      // Descurtir
      likes[sharedTreinoId] = likes[sharedTreinoId].filter((id) => id !== userId);
    } else {
      // Curtir
      likes[sharedTreinoId].push(userId);
    }

    saveLikesToStorage(likes);

    // Atualizar contador no shared treino (local)
    const allShared = getSharedTreinosFromStorage();
    const shared = allShared.find((s) => s.id === sharedTreinoId);
    if (shared) {
      shared.likes = likes[sharedTreinoId].length;
      saveSharedTreinosToStorage(allShared);
    }

    return !hasLiked;
  },

  // Verificar se usuário curtiu
  hasUserLiked: async (sharedTreinoId: string, userId: string): Promise<boolean> => {
    // Verificar no Supabase primeiro
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data } = await supabase
          .from("treino_likes")
          .select("id")
          .eq("shared_treino_id", sharedTreinoId)
          .eq("user_id", userId)
          .maybeSingle();
        
        return !!data;
      } catch (error) {
        console.error("Erro ao verificar like no Supabase:", error);
      }
    }
    
    // Fallback para localStorage
    const likes = getLikesFromStorage();
    return likes[sharedTreinoId]?.includes(userId) ?? false;
  },

  // Adicionar comentário
  addComment: async (
    sharedTreinoId: string,
    userId: string,
    userName: string,
    comment: string
  ): Promise<TreinoComment> => {
    const newComment: TreinoComment = {
      id: Date.now().toString(),
      sharedTreinoId,
      userId,
      userName,
      comment,
      createdAt: new Date().toISOString(),
    };

    // Salvar no Supabase diretamente (não usar saveData para garantir que o trigger funcione)
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("treino_comments")
          .insert({
            id: newComment.id,
            shared_treino_id: sharedTreinoId,
            user_id: userId,
            user_name: userName,
            comment: comment,
            created_at: newComment.createdAt,
          })
          .select()
          .single();

        if (error) throw error;
      } catch (error) {
        console.error("Erro ao salvar comentário no Supabase:", error);
        // Continuar com fallback
      }
    }

    const allComments = getCommentsFromStorage();
    allComments.push(newComment);
    saveCommentsToStorage(allComments);

    // Atualizar contador
    const allShared = getSharedTreinosFromStorage();
    const shared = allShared.find((s) => s.id === sharedTreinoId);
    if (shared) {
      shared.comments = allComments.filter((c) => c.sharedTreinoId === sharedTreinoId).length;
      saveSharedTreinosToStorage(allShared);
    }

    // Atualizar contador no Supabase
    if (supabaseService.isConfigured() && supabase) {
      try {
        const commentCount = allComments.filter((c) => c.sharedTreinoId === sharedTreinoId).length;
        await supabase
          .from("shared_treinos")
          .update({ comments: commentCount })
          .eq("id", sharedTreinoId);
      } catch (error) {
        console.error("Erro ao atualizar contador de comentários:", error);
      }
    }

    return newComment;
  },

  // Obter comentários de um treino
  getComments: async (sharedTreinoId: string): Promise<TreinoComment[]> => {
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("treino_comments")
          .select("*")
          .eq("shared_treino_id", sharedTreinoId)
          .order("created_at", { ascending: true });

        if (!error && data) {
          return data.map((item: any) => ({
            id: item.id,
            sharedTreinoId: item.shared_treino_id,
            userId: item.user_id,
            userName: item.user_name,
            comment: item.comment,
            createdAt: item.created_at,
          }));
        }
      } catch (error) {
        console.error("Erro ao buscar comentários do Supabase:", error);
      }
    }

    // Fallback para localStorage
    const allComments = getCommentsFromStorage();
    return allComments
      .filter((c) => c.sharedTreinoId === sharedTreinoId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  // Remover compartilhamento
  unshareTreino: async (sharedTreinoId: string, userId: string): Promise<boolean> => {
    // Deletar do Supabase
    if (supabaseService.isConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from("shared_treinos")
          .delete()
          .eq("id", sharedTreinoId)
          .eq("user_id", userId); // Segurança: garantir que é do usuário

        if (error) {
          console.error("Erro ao deletar do Supabase:", error);
          // Continuar com fallback
        }
      } catch (error) {
        console.error("Erro ao deletar do Supabase:", error);
      }
    }

    // Fallback: remover do localStorage
    const allShared = getSharedTreinosFromStorage();
    const index = allShared.findIndex((s) => s.id === sharedTreinoId && s.userId === userId);
    
    if (index === -1) return false;

    allShared.splice(index, 1);
    saveSharedTreinosToStorage(allShared);

    // Remover comentários e likes relacionados
    const allComments = getCommentsFromStorage();
    const filteredComments = allComments.filter((c) => c.sharedTreinoId !== sharedTreinoId);
    saveCommentsToStorage(filteredComments);

    const likes = getLikesFromStorage();
    delete likes[sharedTreinoId];
    saveLikesToStorage(likes);

    return true;
  },

  // Adicionar reação em treino compartilhado
  addReaction: async (
    sharedTreinoId: string,
    userId: string,
    userName: string,
    emoji: string
  ): Promise<void> => {
    if (!supabaseService.isConfigured() || !supabase) {
      throw new Error("Supabase não configurado");
    }

    try {
      // Verificar se já reagiu com este emoji
      const { data: existing } = await supabase
        .from("shared_treino_reactions")
        .select("id")
        .eq("shared_treino_id", sharedTreinoId)
        .eq("user_id", userId)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        // Remover reação se já existe
        await supabase
          .from("shared_treino_reactions")
          .delete()
          .eq("id", existing.id);
      } else {
        // Adicionar reação
        await supabase
          .from("shared_treino_reactions")
          .insert({
            shared_treino_id: sharedTreinoId,
            user_id: userId,
            user_name: userName,
            emoji: emoji,
          });
      }
    } catch (error) {
      console.error("Erro ao adicionar reação:", error);
      throw error;
    }
  },

  // Buscar reações de um treino compartilhado
  getReactions: async (sharedTreinoId: string): Promise<Array<{
    id: string;
    user_id: string;
    user_name: string;
    emoji: string;
    created_at: string;
  }>> => {
    if (!supabaseService.isConfigured() || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from("shared_treino_reactions")
        .select("*")
        .eq("shared_treino_id", sharedTreinoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Erro ao buscar reações:", error);
      return [];
    }
  },
};

