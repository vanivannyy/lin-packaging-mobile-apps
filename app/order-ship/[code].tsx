import { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, RADIUS, SHADOW } from "@/lib/theme";
import { formatNumber } from "@/lib/format";
import { DELIVERY_STAGE_LABEL } from "@/lib/labels";
import { api } from "@/lib/api";
import type { DeliveryLookup } from "@/lib/types";

const STAGE_ACTION_LABEL: Record<string, string> = {
  IN_DELIVERY: "Tandai Dalam Perjalanan",
  DELIVERED: "Tandai Terkirim",
};

export default function OrderShipScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [delivery, setDelivery] = useState<DeliveryLookup | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getDeliveryByCode(code);
      setDelivery(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memuat data pengiriman");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAdvance() {
    if (!delivery?.nextStage) return;
    const actionLabel = STAGE_ACTION_LABEL[delivery.nextStage] ?? "Lanjutkan";
    Alert.alert(actionLabel, `Ubah status pengiriman ${delivery.code} menjadi "${DELIVERY_STAGE_LABEL[delivery.nextStage]}"?`, [
      { text: "Batal", style: "cancel" },
      {
        text: "Ya, Lanjutkan",
        onPress: async () => {
          setAdvancing(true);
          try {
            await api.advanceDelivery(delivery.code);
            Alert.alert("Berhasil", "Status pengiriman diperbarui.", [{ text: "OK", onPress: () => router.back() }]);
          } catch (err) {
            Alert.alert("Gagal", err instanceof Error ? err.message : "Terjadi kesalahan");
          } finally {
            setAdvancing(false);
          }
        },
      },
    ]);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (errorMsg || !delivery) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg ?? "Data pengiriman tidak ditemukan"}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.code}>{delivery.code}</Text>
            <Text style={styles.soCode}>{delivery.salesOrder.code}</Text>
          </View>
          <View style={styles.stagePill}>
            <Text style={styles.stagePillText}>{DELIVERY_STAGE_LABEL[delivery.stage] ?? delivery.stage}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.customerName}>{delivery.salesOrder.customerName}</Text>
        <Text style={styles.productLine}>
          {delivery.salesOrder.productName} · {formatNumber(delivery.salesOrder.qty)} pcs
        </Text>
        {delivery.note ? <Text style={styles.noteText}>Catatan: {delivery.note}</Text> : null}
      </View>

      {delivery.nextStage && delivery.canAdvance ? (
        <TouchableOpacity style={styles.advanceBtn} onPress={handleAdvance} disabled={advancing} activeOpacity={0.85}>
          {advancing ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={styles.advanceBtnText}>{STAGE_ACTION_LABEL[delivery.nextStage] ?? "Lanjutkan"}</Text>
            </>
          )}
        </TouchableOpacity>
      ) : delivery.stage === "DELIVERED" ? (
        <View style={styles.doneBanner}>
          <Ionicons name="checkmark-done-circle" size={18} color={COLORS.success} />
          <Text style={styles.doneBannerText}>Pesanan ini sudah terkirim.</Text>
        </View>
      ) : (
        <View style={styles.doneBanner}>
          <Ionicons name="lock-closed" size={16} color={COLORS.textMuted} />
          <Text style={styles.doneBannerText}>Role Anda tidak bisa mengubah status pengiriman.</Text>
        </View>
      )}

      <TouchableOpacity style={styles.scanAgainBtn} onPress={() => router.back()}>
        <Text style={styles.scanAgainText}>← Kembali</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: 16,
    gap: 14,
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
    padding: 18,
    ...SHADOW.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  code: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.primary,
  },
  soCode: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  stagePill: {
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stagePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.warning,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.bg,
    marginVertical: 14,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  productLine: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  noteText: {
    fontSize: 12,
    color: COLORS.warning,
    marginTop: 10,
    fontStyle: "italic",
  },
  advanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
  },
  advanceBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  doneBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    ...SHADOW.card,
  },
  doneBannerText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  scanAgainBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  scanAgainText: {
    color: COLORS.textSecondary,
    fontWeight: "600",
    fontSize: 13,
  },
});
