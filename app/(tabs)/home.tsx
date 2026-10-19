import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Logo } from "@/components/Logo";
import { COLORS, RADIUS, SHADOW } from "@/lib/theme";
import { formatNumber, formatRupiahCompact, greetingByTime } from "@/lib/format";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { hasModule } from "@/lib/types";
import type { DashboardSummary } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  SALES_MANAGER: "Sales Manager",
  SALES: "Sales",
  FINANCE: "Finance",
  WAREHOUSE: "Warehouse",
  QC: "Quality Control",
  PURCHASING: "Purchasing",
  PRODUCTION_PLANNER: "Production Planner",
};

const ALERT_ICON: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  LOW_STOCK: { icon: "cube", color: COLORS.warning, bg: COLORS.warningSoft },
  OVERDUE: { icon: "cash", color: COLORS.danger, bg: COLORS.dangerSoft },
  DELAY: { icon: "time", color: COLORS.info, bg: COLORS.infoSoft },
};

function StatTile({
  icon,
  color,
  bg,
  label,
  value,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  label: string;
  value: string;
  sub?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.statTile} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress}>
      <View style={[styles.statIconWrap, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

function ActionTile({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionTile} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.actionIconWrap}>
        <Ionicons name={icon} size={22} color={COLORS.primary} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { unreadCount, refresh: refreshNotifications } = useNotifications();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setErrorMsg(null);
    try {
      const data = await api.getDashboard();
      setSummary(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memuat ringkasan");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadDashboard().finally(() => setLoading(false));
    refreshNotifications();
  }, [loadDashboard, refreshNotifications]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([loadDashboard(), refreshNotifications()]);
    setRefreshing(false);
  }

  const firstName = user?.name?.split(" ")[0] ?? "";
  const deltaOrders = summary ? summary.salesToday.orderCount - summary.salesYesterday.orderCount : 0;
  const deltaAmount = summary ? summary.salesToday.amount - summary.salesYesterday.amount : 0;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerBrand}>
            <Logo size={30} style={styles.headerLogo} />
            <Text style={styles.headerBrandText}>Lin Packaging</Text>
          </View>
          <TouchableOpacity style={styles.bellBtn} onPress={() => router.push("/notifikasi")}>
            <Ionicons name="notifications" size={20} color="#ffffff" />
            {unreadCount > 0 ? (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        <Text style={styles.greeting}>
          {greetingByTime()}, {firstName || "Rekan"}
        </Text>
        <View style={styles.rolePill}>
          <Text style={styles.rolePillText}>{ROLE_LABEL[user?.role ?? ""] ?? user?.role}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.primary} />}
      >
        {/* Card Penjualan Hari Ini — mengapung di atas header, khas identitas Lin Packaging */}
        <View style={styles.salesCard}>
          <View style={styles.salesCardHeader}>
            <Text style={styles.salesCardTitle}>Penjualan Hari Ini</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Ionicons name="refresh" size={16} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginVertical: 18 }} />
          ) : errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : (
            <View style={styles.salesGrid}>
              <View style={styles.salesCell}>
                <Text style={styles.salesLabel}>Sales Order</Text>
                <Text style={styles.salesValue}>{formatNumber(summary?.salesToday.orderCount ?? 0)}</Text>
                <Text style={[styles.salesDelta, deltaOrders >= 0 ? styles.deltaUp : styles.deltaDown]}>
                  {deltaOrders >= 0 ? "▲" : "▼"} {Math.abs(deltaOrders)} vs kemarin
                </Text>
              </View>
              <View style={styles.salesDivider} />
              <View style={styles.salesCell}>
                <Text style={styles.salesLabel}>Nilai Order</Text>
                <Text style={styles.salesValue}>{formatRupiahCompact(summary?.salesToday.amount ?? 0)}</Text>
                <Text style={[styles.salesDelta, deltaAmount >= 0 ? styles.deltaUp : styles.deltaDown]}>
                  {deltaAmount >= 0 ? "▲" : "▼"} {formatRupiahCompact(Math.abs(deltaAmount))}
                </Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Ringkasan Operasional</Text>
        <View style={styles.statGrid}>
          {hasModule(user, "material-stok") && (
            <StatTile
              icon="cube"
              color={COLORS.warning}
              bg={COLORS.warningSoft}
              label="Stok Menipis"
              value={formatNumber(summary?.stock.lowStockCount ?? 0)}
              sub="material"
              onPress={() => router.push("/(tabs)/gudang")}
            />
          )}
          {hasModule(user, "purchase-request") && (
            <StatTile
              icon="cart"
              color={COLORS.info}
              bg={COLORS.infoSoft}
              label="PR Menunggu"
              value={formatNumber(summary?.purchaseRequest.pendingCount ?? 0)}
              sub={formatRupiahCompact(summary?.purchaseRequest.pendingEstimate ?? 0)}
              onPress={() =>
                Alert.alert(
                  "Purchase Request",
                  `${summary?.purchaseRequest.pendingCount ?? 0} PR menunggu approval senilai ${formatRupiahCompact(
                    summary?.purchaseRequest.pendingEstimate ?? 0,
                  )}.\n\nBuka web app untuk approve/tolak.`,
                )
              }
            />
          )}
          {hasModule(user, "produksi") && (
            <StatTile
              icon="construct"
              color={COLORS.primary}
              bg={COLORS.infoSoft}
              label="Produksi Berjalan"
              value={formatNumber(summary?.production.inProductionCount ?? 0)}
              sub={`${summary?.production.lateCount ?? 0} telat`}
              onPress={() =>
                Alert.alert(
                  "Papan Produksi",
                  `${summary?.production.inProductionCount ?? 0} work order berjalan, ${
                    summary?.production.lateCount ?? 0
                  } melewati deadline.`,
                )
              }
            />
          )}
          {hasModule(user, "delivery") && (
            <StatTile
              icon="car"
              color={COLORS.success}
              bg={COLORS.successSoft}
              label="Siap Kirim"
              value={formatNumber(summary?.delivery.readyCount ?? 0)}
              sub={`${summary?.delivery.inDeliveryCount ?? 0} dalam perjalanan`}
              onPress={() =>
                Alert.alert(
                  "Delivery",
                  `${summary?.delivery.readyCount ?? 0} order siap kirim, ${
                    summary?.delivery.inDeliveryCount ?? 0
                  } sedang dalam perjalanan.`,
                )
              }
            />
          )}
          {hasModule(user, "invoice") && (
            <StatTile
              icon="receipt"
              color={COLORS.danger}
              bg={COLORS.dangerSoft}
              label="Invoice Overdue"
              value={formatNumber(summary?.invoice.overdueCount ?? 0)}
              sub={formatRupiahCompact(summary?.invoice.overdueAmount ?? 0)}
              onPress={() =>
                Alert.alert(
                  "Invoice Overdue",
                  `${summary?.invoice.overdueCount ?? 0} invoice jatuh tempo, total ${formatRupiahCompact(
                    summary?.invoice.overdueAmount ?? 0,
                  )}.`,
                )
              }
            />
          )}
        </View>

        <Text style={styles.sectionTitle}>Aksi Cepat</Text>
        <View style={styles.actionGrid}>
          {hasModule(user, "material-stok") && (
            <ActionTile icon="barcode" label="Scan Material" onPress={() => router.push("/(tabs)/gudang")} />
          )}
          <ActionTile icon="notifications" label="Notifikasi" onPress={() => router.push("/notifikasi")} />
          <ActionTile icon="person-circle" label="Profil Saya" onPress={() => router.push("/(tabs)/profil")} />
        </View>

        <Text style={styles.sectionTitle}>Perlu Perhatian</Text>
        <View style={styles.alertCard}>
          {summary && (summary.alerts?.length ?? 0) > 0 ? (
            summary.alerts.map((alert, idx) => {
              const meta = ALERT_ICON[alert.type] ?? ALERT_ICON.DELAY;
              return (
                <View key={idx} style={[styles.alertRow, idx === summary.alerts.length - 1 && styles.alertRowLast]}>
                  <View style={[styles.alertIconWrap, { backgroundColor: meta.bg }]}>
                    <Ionicons name={meta.icon} size={14} color={meta.color} />
                  </View>
                  <Text style={styles.alertText}>{alert.text}</Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyAlert}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
              <Text style={styles.emptyAlertText}>Semua aman, tidak ada yang perlu diperhatikan.</Text>
            </View>
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
    paddingBottom: 46,
    paddingHorizontal: 20,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLogo: {
    backgroundColor: "#ffffff",
  },
  headerBrandText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#101426",
  },
  greeting: {
    color: "#ffffff",
    fontSize: 21,
    fontWeight: "800",
    marginTop: 20,
  },
  rolePill: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "rgba(212,160,23,0.18)",
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rolePillText: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  salesCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 18,
    marginTop: -34,
    ...SHADOW.card,
  },
  salesCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  salesCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    paddingVertical: 12,
    textAlign: "center",
  },
  salesGrid: {
    flexDirection: "row",
    marginTop: 10,
  },
  salesCell: {
    flex: 1,
  },
  salesDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 16,
  },
  salesLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  salesValue: {
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.textPrimary,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  salesDelta: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 6,
  },
  deltaUp: {
    color: COLORS.success,
  },
  deltaDown: {
    color: COLORS.danger,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 22,
    marginBottom: 10,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statTile: {
    width: "47%",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 14,
    ...SHADOW.card,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  statValue: {
    fontSize: 19,
    fontWeight: "800",
    color: COLORS.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: "600",
  },
  statSub: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  actionGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionTile: {
    flex: 1,
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    ...SHADOW.card,
  },
  actionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  alertCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    ...SHADOW.card,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg,
  },
  alertRowLast: {
    borderBottomWidth: 0,
  },
  alertIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  alertText: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  emptyAlert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 16,
  },
  emptyAlertText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
});
