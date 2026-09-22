import React, { createContext, useCallback, useContext, useState } from "react";
import { api } from "@/lib/api";
import type { NotificationItem } from "@/lib/types";

type NotificationsContextValue = {
  items: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.getNotifications();
      setItems(result.items);
      setUnreadCount(result.unreadCount);
    } catch {
      // Diamkan — halaman yang butuh data akan menampilkan state kosong/error sendiri.
    } finally {
      setLoading(false);
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      const result = await api.markNotificationRead(id);
      setUnreadCount(result.unreadCount);
    } catch {
      // no-op, biarkan state optimis
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      const result = await api.markAllNotificationsRead();
      setUnreadCount(result.unreadCount);
    } catch {
      // no-op
    }
  }, []);

  return (
    <NotificationsContext.Provider value={{ items, unreadCount, loading, refresh, markRead, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
