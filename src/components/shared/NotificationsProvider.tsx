import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

/** Mounted inside AuthProvider to subscribe to realtime DB events for notifications. */
export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  useRealtimeNotifications();
  return <>{children}</>;
}
