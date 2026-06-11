import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string | null;
  sender_name: string | null;
  sender_role: string;
  content: string;
  message_type: string;
  is_read: boolean;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  status: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_admin_count: number;
  unread_user_count: number;
  created_at: string;
}

/** Hook for the end-user floating chat */
export function useLiveChat() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [conversation, setConversation] = useState<ChatConversation | null>(null);

  // Get or create conversation (one per user)
  useEffect(() => {
    if (!user) {
      setConversation(null);
      return;
    }
    (async () => {
      const { data: existing } = await supabase
        .from("chat_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (existing) {
        setConversation(existing as ChatConversation);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();
      const { data: created, error } = await supabase
        .from("chat_conversations")
        .upsert(
          {
            user_id: user.id,
            user_name: profile?.full_name || user.email,
            user_email: profile?.email || user.email,
            status: "auto_reply",
          },
          { onConflict: "user_id" }
        )
        .select()
        .single();
      if (created) setConversation(created as ChatConversation);
      else if (error) console.error("create conv error", error);
    })();
  }, [user]);

  const messagesQuery = useQuery({
    queryKey: ["chat-messages", conversation?.id],
    queryFn: async () => {
      if (!conversation) return [] as ChatMessage[];
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      return (data || []) as ChatMessage[];
    },
    enabled: !!conversation,
  });

  // Realtime
  useEffect(() => {
    if (!conversation) return;
    const ch = supabase
      .channel(`chat-${conversation.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversation.id}` },
        () => qc.invalidateQueries({ queryKey: ["chat-messages", conversation.id] })
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_conversations", filter: `id=eq.${conversation.id}` },
        (p) => setConversation(p.new as ChatConversation)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversation?.id, qc]);

  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation || !user) throw new Error("No conversation");
      // Insert user message
      await supabase.from("chat_messages").insert({
        conversation_id: conversation.id,
        sender_id: user.id,
        sender_name: conversation.user_name,
        sender_role: "user",
        content,
        message_type: "user",
      });
      await supabase
        .from("chat_conversations")
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);

      // If currently in auto_reply mode, ask system
      if (conversation.status !== "dibalas_admin") {
        await supabase.functions.invoke("chat-auto-reply", {
          body: { conversation_id: conversation.id, message: content },
        });
      }
    },
  });

  return {
    conversation,
    messages: messagesQuery.data || [],
    isLoading: messagesQuery.isLoading,
    sendMessage,
  };
}

/** Admin hooks */
export function useAdminConversations(opts?: { enabled?: boolean }) {
  const enabled = opts?.enabled ?? true;
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-chat-conversations"],
    enabled,
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      return (data || []) as ChatConversation[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-chat-conv")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-chat-conversations"] })
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_messages" }, () =>
        qc.invalidateQueries({ queryKey: ["admin-chat-conversations"] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  return query;
}

export function useAdminMessages(conversationId: string | null) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["admin-chat-messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [] as ChatMessage[];
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      return (data || []) as ChatMessage[];
    },
    enabled: !!conversationId,
  });

  useEffect(() => {
    if (!conversationId) return;
    const ch = supabase
      .channel(`admin-msg-${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conversationId}` },
        () => qc.invalidateQueries({ queryKey: ["admin-chat-messages", conversationId] })
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversationId, qc]);

  return query;
}

export function useAdminReply() {
  const { user, role } = useAuth();
  return useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: string; content: string }) => {
      if (!user) throw new Error("Not auth");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: profile?.full_name || user.email,
        sender_role: role || "admin",
        content,
        message_type: "admin",
      });
      await supabase
        .from("chat_conversations")
        .update({
          status: "dibalas_admin",
          last_message: content,
          last_message_at: new Date().toISOString(),
          unread_admin_count: 0,
        })
        .eq("id", conversationId);
    },
  });
}

export function useKnowledgeBase() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["chat-kb"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_knowledge_base")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  const create = useMutation({
    mutationFn: async (payload: { question: string; answer: string; keywords: string[]; is_active: boolean }) => {
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("chat_knowledge_base").insert({ ...payload, created_by: u.user?.id });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-kb"] }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; question: string; answer: string; keywords: string[]; is_active: boolean }) => {
      await supabase.from("chat_knowledge_base").update(payload).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-kb"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("chat_knowledge_base").delete().eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-kb"] }),
  });

  const removeAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("chat_knowledge_base")
        .delete()
        .not("id", "is", null);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-kb"] }),
  });

  return { ...query, create, update, remove, removeAll };
}
