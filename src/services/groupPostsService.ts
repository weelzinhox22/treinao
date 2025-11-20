// Serviço para Posts do Grupo (Feed Social)
import { supabase } from "@/config/supabase";

export interface GroupPost {
  id: string;
  group_id: string;
  user_id: string;
  user_name: string;
  user_avatar_url?: string;
  title: string;
  description?: string;
  workout_type: 'musculacao' | 'cardio' | 'yoga' | 'outro';
  duration_minutes: number;
  exercises?: any[];
  total_volume?: number;
  photo_url?: string;
  mood_emoji?: string;
  points: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  
  // Relacionamentos (carregados separadamente)
  user_liked?: boolean;
  reactions?: PostReaction[];
  comments?: PostComment[];
}

export interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  emoji: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar_url?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const groupPostsService = {
  // Buscar posts do grupo
  async getGroupPosts(groupId: string, userId: string): Promise<GroupPost[]> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("group_posts")
      .select("*")
      .eq("group_id", groupId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Verificar quais posts o usuário curtiu
    const postIds = data.map((p: any) => p.id);
    const { data: likes } = await supabase
      .from("group_post_likes")
      .select("post_id")
      .in("post_id", postIds)
      .eq("user_id", userId);

    const likedPostIds = new Set(likes?.map((l: any) => l.post_id) || []);

    return data.map((post: any) => ({
      ...post,
      user_liked: likedPostIds.has(post.id),
    }));
  },

  // Criar post
  async createPost(post: Omit<GroupPost, 'id' | 'likes_count' | 'comments_count' | 'created_at' | 'updated_at'>): Promise<GroupPost> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("group_posts")
      .insert(post)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Deletar post
  async deletePost(postId: string): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { error } = await supabase
      .from("group_posts")
      .delete()
      .eq("id", postId);

    if (error) throw error;
  },

  // Buscar posts de um usuário específico
  async getUserPosts(userId: string): Promise<GroupPost[]> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("group_posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Curtir post
  async likePost(postId: string, userId: string, userName: string): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { error } = await supabase
      .from("group_post_likes")
      .insert({
        post_id: postId,
        user_id: userId,
        user_name: userName,
      });

    if (error) throw error;
  },

  // Descurtir post
  async unlikePost(postId: string, userId: string): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { error } = await supabase
      .from("group_post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) throw error;
  },

  // Buscar quem curtiu o post
  async getLikes(postId: string): Promise<Array<{ user_id: string; user_name: string }>> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("group_post_likes")
      .select("user_id, user_name")
      .eq("post_id", postId);

    if (error) throw error;
    return data || [];
  },

  // Adicionar reação
  async addReaction(postId: string, userId: string, userName: string, emoji: string): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { error } = await supabase
      .from("group_post_reactions")
      .insert({
        post_id: postId,
        user_id: userId,
        user_name: userName,
        emoji,
      });

    if (error) throw error;
  },

  // Remover reação
  async removeReaction(postId: string, userId: string, emoji: string): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { error } = await supabase
      .from("group_post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId)
      .eq("emoji", emoji);

    if (error) throw error;
  },

  // Buscar reações de um post
  async getReactions(postId: string): Promise<PostReaction[]> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("group_post_reactions")
      .select("*")
      .eq("post_id", postId);

    if (error) throw error;
    return data;
  },

  // Adicionar comentário
  async addComment(postId: string, userId: string, userName: string, userAvatarUrl: string | undefined, content: string): Promise<PostComment> {
    if (!supabase) throw new Error("Supabase não configurado");

    // Buscar avatar_url do perfil do usuário se não foi fornecido
    let avatarUrl = userAvatarUrl;
    if (!avatarUrl) {
      try {
        const { data: profile } = await supabase
          .from("users")
          .select("avatar_url")
          .eq("id", userId)
          .single();
        avatarUrl = profile?.avatar_url || undefined;
      } catch (error) {
        console.warn("Erro ao buscar avatar do usuário:", error);
      }
    }

    const { data, error } = await supabase
      .from("group_post_comments")
      .insert({
        post_id: postId,
        user_id: userId,
        user_name: userName,
        user_avatar_url: avatarUrl,
        content,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Buscar comentários de um post
  async getComments(postId: string): Promise<PostComment[]> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { data, error } = await supabase
      .from("group_post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    // Se algum comentário não tiver avatar_url, buscar do perfil do usuário
    const commentsWithAvatars = await Promise.all(
      (data || []).map(async (comment: PostComment) => {
        if (comment.user_avatar_url) {
          return comment;
        }

        try {
          const { data: profile } = await supabase
            .from("users")
            .select("avatar_url")
            .eq("id", comment.user_id)
            .single();

          return {
            ...comment,
            user_avatar_url: profile?.avatar_url || undefined,
          };
        } catch {
          return comment;
        }
      })
    );

    return commentsWithAvatars;
  },

  // Deletar comentário
  async deleteComment(commentId: string): Promise<void> {
    if (!supabase) throw new Error("Supabase não configurado");

    const { error } = await supabase
      .from("group_post_comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;
  },
};

