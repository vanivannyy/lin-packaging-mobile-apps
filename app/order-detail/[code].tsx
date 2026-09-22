import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, RADIUS, SHADOW } from "@/lib/theme";
import { formatRupiah, formatNumber } from "@/lib/format";
import { SO_STATUS_LABEL, WO_STAGE_LABEL, DELIVERY_STAGE_LABEL } from "@/lib/labels";
import { api } from "@/lib/api";
import type { SalesOrderDetail } from "@/lib/types";

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

export default function OrderDetailScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<SalesOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getSalesOrderByCode(code);
      setDetail(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memuat Sales Order");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (errorMsg || !detail) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg ?? "Sales Order tidak ditemukan"}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.soCode}>{detail.code}</Text>
            <Text style={styles.customerName}>{detail.customer.name}</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>{SO_STATUS_LABEL[detail.status] ?? detail.status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <InfoRow label="Produk" value={detail.productName} />
        <InfoRow label="Qty" value={`${formatNumber(detail.qty)} pcs`} />
        <InfoRow label="Nilai Order" value={formatRupiah(detail.totalAmount)} />
        <InfoRow label="No. Telepon" value={detail.customer.phone} />
        <InfoRow
          label="Tgl Kirim Diminta"
          value={detail.requestedDeliveryDate ? new Date(detail.requestedDeliveryDate).toLocaleDateString("id-ID") : "-"}
        />
      </View>

      {detail.workOrder ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Produksi</Text>
          <InfoRow label="Kode WO" value={detail.workOrder.code} />
          <InfoRow label="Tahap" value={WO_STAGE_LABEL[detail.workOrder.stage] ?? detail.workOrder.stage} />
          <InfoRow label="Progress" value={`${detail.workOrder.progressPercent}%`} />
          <InfoRow
            label="QC"
            value={detail.workOrder.qcPassed === null ? "Belum QC" : detail.workOrder.qcPassed ? "Lolos" : "Reject"}
          />
        </View>
      ) : null}

      {detail.deliveryOrder ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Pengiriman</Text>
          <InfoRow label="Kode DO" value={detail.deliveryOrder.code} />
          <InfoRow
            label="Status"
            value={DELIVERY_STAGE_LABEL[detail.deliveryOrder.stage] ?? detail.deliveryOrder.stage}
          />
          <InfoRow label="Catatan" value={detail.deliveryOrder.note} />
        </View>
      ) : null}

      {detail.invoice ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Invoice</Text>
          <InfoRow label="Kode" value={detail.invoice.code} />
          <InfoRow label="Status" value={detail.invoice.status} />
          <InfoRow
            label="Jatuh Tempo"
            value={detail.invoice.dueDate ? new Date(detail.invoice.dueDate).toLocaleDateString("id-ID") : "-"}
          />
        </View>
      ) : null}

      {detail.deliveryOrder ? (
        <TouchableOpacity
          style={styles.shipBtn}
          onPress={() => router.push({ pathname: "/order-ship/[code]", params: { code: detail.code } })}
        >
          <Ionicons name="cube" size={16} color="#ffffff" />
          <Text style={styles.shipBtnText}>Buka Halaman Kirim</Text>
        </TouchableOpacity>
      ) : null}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
    backgroundColor: COLORS.bg,
  },
  errorText: {
    color: COLORS.danger,
    textAlign: "center",
    fontSize: 14,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 16,
    ...SHADOW.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  soCode: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  customerName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
    fontWeight: "600",
  },
  statusPill: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.warning,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.bg,
    marginVertical: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg,
  },
  infoLabel: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 12.5,
    color: COLORS.textPrimary,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  shipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
  },
  shipBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
});
