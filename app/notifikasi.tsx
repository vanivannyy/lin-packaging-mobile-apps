import { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SHADOW } from "@/lib/theme";
import { formatRelativeTime } from "@/lib/format";
import { useNotifications } from "@/lib/notifications-context";
import type { NotificationItem } from "@/lib/types";

const TYPE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  STATUS: "swap-horizontal",
  APPROVAL: "checkmark-done",
  ACTION: "alert-circle",
};

export default function NotifikasiScreen() {
  const { items, unreadCount, loading, refresh, markRead, markAllRead } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  function renderItem({ item }: { item: NotificationItem }) {
    const icon = TYPE_ICON[item.type] ?? "notifications";
    return (
      <TouchableOpacity
        style={[styles.item, !item.isRead && styles.itemUnread]}
        activeOpacity={0.7}
        onPress={() => !item.isRead && markRead(item.id)}
      >
        <View style={[styles.itemIconWrap, !item.isRead && styles.itemIconWrapUnread]}>
          <Ionicons name={icon} size={16} color={!item.isRead ? COLORS.primary : COLORS.textMuted} />
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemHeaderRow}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead ? <View style={styles.dot} /> : null}
          </View>
          <Text style={styles.itemMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.itemTime}>{formatRelativeTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      {unreadCount > 0 ? (
        <View style={styles.toolbar}>
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Tandai semua dibaca</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Ionicons name="notifications-off-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Belum ada notifikasi</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 14,
    alignItems: "flex-end",
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.primary,
  },
  listContent: {
    padding: 16,
  },
  item: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 14,
    ...SHADOW.card,
  },
  itemUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.accent,
  },
  itemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  itemIconWrapUnread: {
    backgroundColor: COLORS.accentSoft,
  },
  itemBody: {
    flex: 1,
  },
  itemHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemTitle: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.accent,
  },
  itemMessage: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 17,
  },
  itemTime: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
