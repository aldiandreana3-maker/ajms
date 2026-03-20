import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  sender_id: string;
  sender_name: string | null;
  created_at: string;
}

export interface BroadcastMessageRead {
  id: string;
  message_id: string;
  user_id: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export function useBroadcastMessages() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all broadcast messages (admin view)
  const messagesQuery = useQuery({
    queryKey: ["broadcast-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("broadcast_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BroadcastMessage[];
    },
    enabled: !!user,
  });

  // Fetch messages with read status for current user (inbox view)
  const inboxQuery = useQuery({
    queryKey: ["broadcast-inbox", user?.id],
    queryFn: async () => {
      // Get all messages
      const { data: messages, error: msgError } = await supabase
        .from("broadcast_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (msgError) throw msgError;

      // Get read statuses for current user
      const { data: reads, error: readError } = await supabase
        .from("broadcast_message_reads")
        .select("*")
        .eq("user_id", user!.id);
      if (readError) throw readError;

      const readMap = new Map((reads as BroadcastMessageRead[]).map((r) => [r.message_id, r]));

      return (messages as BroadcastMessage[]).map((msg) => ({
        ...msg,
        is_read: readMap.get(msg.id)?.is_read ?? false,
        read_at: readMap.get(msg.id)?.read_at ?? null,
      }));
    },
    enabled: !!user,
  });

  // Unread count
  const unreadCount = inboxQuery.data?.filter((m) => !m.is_read).length ?? 0;

  // Send broadcast message
  const sendMessage = useMutation({
    mutationFn: async ({ title, content }: { title: string; content: string }) => {
      // Get sender profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single();

      // Insert broadcast message
      const { data: message, error: msgError } = await supabase
        .from("broadcast_messages")
        .insert({
          title,
          content,
          sender_id: user!.id,
          sender_name: profile?.full_name || "Admin",
        })
        .select()
        .single();
      if (msgError) throw msgError;

      // Get all penghuni and agent user_ids
      const { data: penghuniUsers, error: penghuniError } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["penghuni", "agent"]);
      if (penghuniError) throw penghuniError;

      if (penghuniUsers && penghuniUsers.length > 0) {
        // Batch insert read records
        const readRecords = penghuniUsers.map((u: { user_id: string }) => ({
          message_id: (message as BroadcastMessage).id,
          user_id: u.user_id,
          is_read: false,
        }));

        const { error: readError } = await supabase
          .from("broadcast_message_reads")
          .insert(readRecords);
        if (readError) throw readError;
      }

      return message;
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Pesan berhasil dikirim ke semua penghuni" });
      queryClient.invalidateQueries({ queryKey: ["broadcast-messages"] });
      queryClient.invalidateQueries({ queryKey: ["broadcast-inbox"] });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  // Mark message as read
  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("broadcast_message_reads")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("message_id", messageId)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast-inbox"] });
    },
  });

  // Delete message (admin only)
  const deleteMessage = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("broadcast_messages")
        .delete()
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "Pesan berhasil dihapus" });
      queryClient.invalidateQueries({ queryKey: ["broadcast-messages"] });
      queryClient.invalidateQueries({ queryKey: ["broadcast-inbox"] });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  return {
    messages: messagesQuery.data ?? [],
    inbox: inboxQuery.data ?? [],
    unreadCount,
    isLoading: messagesQuery.isLoading || inboxQuery.isLoading,
    sendMessage,
    markAsRead,
    deleteMessage,
  };
}
