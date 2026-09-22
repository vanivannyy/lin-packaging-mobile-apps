import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { COLORS, RADIUS, SHADOW } from "@/lib/theme";
import { formatRupiahCompact } from "@/lib/format";
import { SO_STATUS_LABEL } from "@/lib/labels";
import { api } from "@/lib/api";
import type { SalesOrderListItem } from "@/lib/types";

const STATUS_TONE: Record<string, { color: string; bg: string }> = {
  MATERIAL_CHECK: { color: COLORS.info, bg: COLORS.infoSoft },
  PRODUCTION: { color: COLORS.primary, bg: COLORS.infoSoft },
  READY_DELIVERY: { color: COLORS.warning, bg: COLORS.warningSoft },
  DELIVERED: { color: COLORS.success, bg: COLORS.successSoft },
  CANCELLED: { color: COLORS.danger, bg: COLORS.dangerSoft },
};

function ActionButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon} size={20} color="#ffffff" />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function OrderScreen() {
  const router = useRouter();
  const [items, setItems] = useState<SalesOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      const result = await api.getSalesOrders();
      setItems(result.items);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memuat daftar Sales Order");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load]);

  async function handleRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function renderItem({ item }: { item: SalesOrderListItem }) {
    const tone = STATUS_TONE[item.status] ?? STATUS_TONE.MATERIAL_CHECK;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => router.push({ pathname: "/order-detail/[code]", params: { code: item.code } })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardCode}>{item.code}</Text>
          <View style={[styles.statusPill, { backgroundColor: tone.bg }]}>
            <Text style={[styles.statusPillText, { color: tone.color }]}>{SO_STATUS_LABEL[item.status] ?? item.status}</Text>
          </View>
        </View>
        <Text style={styles.cardCustomer}>{item.customerName}</Text>
        <Text style={styles.cardProduct} numberOfLines={1}>
          {item.productName} · {item.qty} pcs
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardAmount}>{formatRupiahCompact(item.totalAmount)}</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Order</Text>
        <Text style={styles.headerSubtitle}>Pantau &amp; verifikasi Sales Order</Text>
      </View>

      <View style={styles.actionRow}>
        <ActionButton icon="search" label="Cek Order" onPress={() => router.push("/order-scan-check")} />
        <ActionButton icon="cube" label="Kirim" onPress={() => router.push("/order-scan-ship")} />
      </View>

      <Text style={styles.sectionTitle}>Daftar Sales Order</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="document-text-outline" size={28} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Belum ada Sales Order</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 19,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: -18,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    ...SHADOW.card,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 22,
    marginBottom: 4,
    marginHorizontal: 16,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 14,
    ...SHADOW.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardCode: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.primary,
    fontVariant: ["tabular-nums"],
  },
  statusPill: {
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: "700",
  },
  cardCustomer: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 8,
  },
  cardProduct: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.bg,
  },
  cardAmount: {
    fontSize: 13,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: "center",
    marginTop: 24,
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
});
