import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { COLORS, RADIUS, SHADOW } from "@/lib/theme";
import { formatNumber } from "@/lib/format";
import { api } from "@/lib/api";
import type { WorkOrderListItem } from "@/lib/types";

export default function QcScreen() {
  const router = useRouter();
  const [items, setItems] = useState<WorkOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      const result = await api.getWorkOrders("QC");
      setItems(result.items);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memuat antrian QC");
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

  function renderItem({ item }: { item: WorkOrderListItem }) {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => router.push({ pathname: "/qc-detail/[code]", params: { code: item.code } })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardCode}>{item.code}</Text>
          <View style={styles.qcPill}>
            <Text style={styles.qcPillText}>Menunggu QC</Text>
          </View>
        </View>
        <Text style={styles.cardCustomer}>{item.customerName}</Text>
        <Text style={styles.cardProduct} numberOfLines={1}>
          {item.productName} · {formatNumber(item.qty)} pcs
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quality Control</Text>
        <Text style={styles.headerSubtitle}>Isi nomor Work Order &amp; checklist inspeksi</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.scanBtn} onPress={() => router.push("/qc-scan")} activeOpacity={0.85}>
          <View style={styles.scanIconWrap}>
            <Ionicons name="keypad" size={22} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scanBtnTitle}>Cek Work Order</Text>
            <Text style={styles.scanBtnSubtitle}>Isi nomor WO untuk mulai inspeksi</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Antrian Menunggu QC</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 24 }} />
      ) : errorMsg ? (
        <Text style={styles.errorText}>{errorMsg}</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="checkmark-done-circle-outline" size={28} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Tidak ada Work Order menunggu QC</Text>
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
    paddingHorizontal: 16,
    marginTop: -18,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 14,
    ...SHADOW.card,
  },
  scanIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBtnTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  scanBtnSubtitle: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  qcPill: {
    backgroundColor: COLORS.warningSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  qcPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    color: COLORS.warning,
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
