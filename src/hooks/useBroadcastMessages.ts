import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export type TargetType = "all" | "tower" | "unit" | "custom";

export interface BroadcastMessage {
  id: string;
  title: string;
  content: string;
  sender_id: string;
  sender_name: string | null;
  target_type: TargetType;
  target_value: string[];
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

interface SendMessageParams {
  title: string;
  content: string;
  targetType: TargetType;
  targetValue: string[];
}

export function useBroadcastMessages() {
  const { user, isAdmin, isStaff } = useAuth();
  const queryClient = useQueryClient();

  // Admin/staff see all messages; penghuni/agent only see those targeted to them
  const canSeeAll = isAdmin || isStaff;

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

  const inboxQuery = useQuery({
    queryKey: ["broadcast-inbox", user?.id, canSeeAll],
    queryFn: async () => {
      const { data: reads, error: readError } = await supabase
        .from("broadcast_message_reads")
        .select("*")
        .eq("user_id", user!.id);
      if (readError) throw readError;

      const readMap = new Map((reads as BroadcastMessageRead[]).map((r) => [r.message_id, r]));

      if (canSeeAll) {
        // Admin/Staff: see all broadcasts
        const { data: messages, error: msgError } = await supabase
          .from("broadcast_messages")
          .select("*")
          .order("created_at", { ascending: false });
        if (msgError) throw msgError;
        return (messages as BroadcastMessage[]).map((msg) => ({
          ...msg,
          is_read: readMap.get(msg.id)?.is_read ?? false,
          read_at: readMap.get(msg.id)?.read_at ?? null,
        }));
      }

      // Penghuni/Agent: only messages where they are a recipient (have a read record)
      const messageIds = Array.from(readMap.keys());
      if (messageIds.length === 0) return [];

      const { data: messages, error: msgError } = await supabase
        .from("broadcast_messages")
        .select("*")
        .in("id", messageIds)
        .order("created_at", { ascending: false });
      if (msgError) throw msgError;

      return (messages as BroadcastMessage[]).map((msg) => ({
        ...msg,
        is_read: readMap.get(msg.id)?.is_read ?? false,
        read_at: readMap.get(msg.id)?.read_at ?? null,
      }));
    },
    enabled: !!user,
  });

  const unreadCount = inboxQuery.data?.filter((m) => !m.is_read).length ?? 0;

  // Helper: fetch all rows with pagination
  async function fetchAllUserIds(query: any): Promise<string[]> {
    let allIds: string[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;
    while (hasMore) {
      const { data, error } = await query.range(from, from + batchSize - 1);
      if (error) throw error;
      const ids = (data || []).map((r: any) => r.user_id).filter(Boolean);
      allIds = allIds.concat(ids);
      hasMore = (data?.length || 0) === batchSize;
      from += batchSize;
    }
    return [...new Set(allIds)];
  }

  const sendMessage = useMutation({
    mutationFn: async ({ title, content, targetType, targetValue }: SendMessageParams) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user!.id)
        .single();

      const { data: message, error: msgError } = await supabase
        .from("broadcast_messages")
        .insert({
          title,
          content,
          sender_id: user!.id,
          sender_name: profile?.full_name || "Admin",
          target_type: targetType,
          target_value: targetValue,
        })
        .select()
        .single();
      if (msgError) throw msgError;

      // Resolve target user_ids based on targetType
      let targetUserIds: string[] = [];

      if (targetType === "all") {
        const { data: allUsers, error } = await supabase
          .from("user_roles")
          .select("user_id")
          .in("role", ["penghuni", "agent"]);
        if (error) throw error;
        targetUserIds = (allUsers || []).map((u) => u.user_id);
      } else if (targetType === "tower") {
        // Get penghuni with units in selected towers
        // Units have building column matching tower name
        let allPenghuni: any[] = [];
        for (const tower of targetValue) {
          const { data: units } = await supabase
            .from("units")
            .select("id")
            .eq("building", tower);
          if (units && units.length > 0) {
            const unitIds = units.map((u) => u.id);
            const { data: penghuni } = await supabase
              .from("penghuni")
              .select("user_id")
              .in("unit_id", unitIds)
              .eq("is_active", true)
              .not("user_id", "is", null);
            if (penghuni) allPenghuni = allPenghuni.concat(penghuni);
          }
        }
        targetUserIds = [...new Set(allPenghuni.map((p) => p.user_id).filter(Boolean))];
      } else if (targetType === "unit") {
        // Get penghuni linked to specific unit numbers
        const { data: penghuni } = await supabase
          .from("penghuni")
          .select("user_id")
          .in("unit_number", targetValue)
          .eq("is_active", true)
          .not("user_id", "is", null);
        targetUserIds = [...new Set((penghuni || []).map((p) => p.user_id).filter(Boolean))];
      } else if (targetType === "custom") {
        // targetValue contains user_ids directly
        targetUserIds = targetValue;
      }

      if (targetUserIds.length > 0) {
        // Batch insert in chunks of 500
        const msgId = (message as BroadcastMessage).id;
        for (let i = 0; i < targetUserIds.length; i += 500) {
          const batch = targetUserIds.slice(i, i + 500).map((uid) => ({
            message_id: msgId,
            user_id: uid,
            is_read: false,
          }));
          const { error: readError } = await supabase
            .from("broadcast_message_reads")
            .insert(batch);
          if (readError) throw readError;
        }
      }

      return { message, recipientCount: targetUserIds.length };
    },
    onSuccess: (data) => {
      toast({
        title: "Berhasil",
        description: `Pesan dikirim ke ${data.recipientCount} penerima`,
      });
      queryClient.invalidateQueries({ queryKey: ["broadcast-messages"] });
      queryClient.invalidateQueries({ queryKey: ["broadcast-inbox"] });
    },
    onError: (error: Error) => {
      toast({ title: "Gagal", description: error.message, variant: "destructive" });
    },
  });

  const markAsRead = useMutation({
    mutationFn: async (messageId: string) => {
      // Use upsert: if no read record exists, create one; if it exists, update it
      const { error } = await supabase
        .from("broadcast_message_reads")
        .upsert(
          {
            message_id: messageId,
            user_id: user!.id,
            is_read: true,
            read_at: new Date().toISOString(),
          },
          { onConflict: "message_id,user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["broadcast-inbox"] });
    },
  });

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
