import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLORS, RADIUS, SHADOW } from "@/lib/theme";
import { formatNumber, formatRelativeTime } from "@/lib/format";
import { WO_STAGE_LABEL, QC_CHECK_LABEL } from "@/lib/labels";
import { api } from "@/lib/api";
import type { WorkOrderDetail } from "@/lib/types";

type CheckType = "PRINTING" | "FINISHING";

function SegButton({
  label,
  active,
  onPress,
  tone = "primary",
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  tone?: "primary" | "success" | "danger";
}) {
  const activeColor = tone === "success" ? COLORS.success : tone === "danger" ? COLORS.danger : COLORS.primary;
  return (
    <TouchableOpacity
      style={[styles.segBtn, active && { backgroundColor: activeColor, borderColor: activeColor }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.segBtnText, active && styles.segBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function QcDetailScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();

  const [detail, setDetail] = useState<WorkOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [checkType, setCheckType] = useState<CheckType>("PRINTING");
  const [passed, setPassed] = useState<boolean | null>(null);
  const [note, setNote] = useState("");
  const [submittingCheck, setSubmittingCheck] = useState(false);

  const [decision, setDecision] = useState<"PASS" | "REJECT" | null>(null);
  const [rejectRate, setRejectRate] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const load = useCallback(async () => {
    if (!code) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getWorkOrderByCode(code);
      setDetail(data);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Gagal memuat Work Order");
    } finally {
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmitCheck() {
    if (!code || passed === null) {
      Alert.alert("Lengkapi Data", "Pilih hasil Lulus/Tidak Lulus sebelum menyimpan.");
      return;
    }
    setSubmittingCheck(true);
    try {
      await api.submitQcCheck(code, { checkType, passed, note: note.trim() || undefined });
      setNote("");
      setPassed(null);
      await load();
      Alert.alert("Tersimpan", "Checklist inspeksi berhasil disimpan.");
    } catch (err) {
      Alert.alert("Gagal", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmittingCheck(false);
    }
  }

  async function handleSubmitDecision() {
    if (!code || !decision) return;
    const rate = decision === "REJECT" ? Math.min(100, Math.max(0, Number(rejectRate) || 0)) : 0;
    if (decision === "REJECT" && !rejectRate.trim()) {
      Alert.alert("Lengkapi Data", "Isi persentase reject terlebih dahulu.");
      return;
    }
    Alert.alert(
      decision === "PASS" ? "Lulus QC" : "Reject QC",
      decision === "PASS"
        ? `Tandai ${code} Lolos QC?`
        : `Tandai ${code} Reject dengan reject rate ${rate}%? Work order akan dipindah ke Rework.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Ya, Simpan",
          onPress: async () => {
            setSubmittingDecision(true);
            try {
              await api.submitQcResult(code, { passed: decision === "PASS", rejectRatePercent: rate });
              setDecision(null);
              setRejectRate("");
              await load();
              Alert.alert("Berhasil", "Keputusan QC tersimpan.");
            } catch (err) {
              Alert.alert("Gagal", err instanceof Error ? err.message : "Terjadi kesalahan");
            } finally {
              setSubmittingDecision(false);
            }
          },
        },
      ],
    );
  }

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
        <Text style={styles.errorText}>{errorMsg ?? "Work Order tidak ditemukan"}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.woCode}>{detail.code}</Text>
              <Text style={styles.customerName}>{detail.customerName}</Text>
            </View>
            <View style={styles.stagePill}>
              <Text style={styles.stagePillText}>{WO_STAGE_LABEL[detail.stage] ?? detail.stage}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statGrid}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{formatNumber(detail.qty)}</Text>
              <Text style={styles.statLabel}>Qty Order</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{formatNumber(detail.goodQtyTotal)}</Text>
              <Text style={styles.statLabel}>Good</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={[styles.statValue, { color: COLORS.danger }]}>{formatNumber(detail.rejectQtyTotal)}</Text>
              <Text style={styles.statLabel}>Reject</Text>
            </View>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{detail.progressPercent}%</Text>
              <Text style={styles.statLabel}>Progress</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.productLine}>{detail.productName}</Text>
          <Text style={styles.soCode}>SO: {detail.soCode}</Text>
        </View>

        {detail.stage === "QC" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Keputusan Akhir QC</Text>
            <View style={styles.segRow}>
              <SegButton label="Lulus" active={decision === "PASS"} tone="success" onPress={() => setDecision("PASS")} />
              <SegButton label="Reject" active={decision === "REJECT"} tone="danger" onPress={() => setDecision("REJECT")} />
            </View>
            {decision === "REJECT" ? (
              <TextInput
                style={styles.input}
                value={rejectRate}
                onChangeText={setRejectRate}
                placeholder="Reject rate % (mis. 5)"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numeric"
              />
            ) : null}
            {decision ? (
              <TouchableOpacity
                style={[styles.submitBtn, decision === "REJECT" && { backgroundColor: COLORS.danger }]}
                onPress={handleSubmitDecision}
                disabled={submittingDecision}
              >
                {submittingDecision ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Simpan Keputusan</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Checklist Inspeksi</Text>
          <Text style={styles.fieldLabel}>Jenis Pemeriksaan</Text>
          <View style={styles.segRow}>
            <SegButton label="QC Printing" active={checkType === "PRINTING"} onPress={() => setCheckType("PRINTING")} />
            <SegButton label="QC Finishing" active={checkType === "FINISHING"} onPress={() => setCheckType("FINISHING")} />
          </View>

          <Text style={styles.fieldLabel}>Hasil</Text>
          <View style={styles.segRow}>
            <SegButton label="Lulus" active={passed === true} tone="success" onPress={() => setPassed(true)} />
            <SegButton label="Tidak Lulus" active={passed === false} tone="danger" onPress={() => setPassed(false)} />
          </View>

          <Text style={styles.fieldLabel}>Catatan (opsional)</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={note}
            onChangeText={setNote}
            placeholder="Temuan / catatan inspeksi"
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={2}
          />

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitCheck} disabled={submittingCheck}>
            {submittingCheck ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Simpan Checklist</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Riwayat Inspeksi</Text>
          {detail.qcChecks.length === 0 ? (
            <Text style={styles.emptyHistoryText}>Belum ada riwayat inspeksi.</Text>
          ) : (
            detail.qcChecks.map((c, idx) => (
              <View key={c.id} style={[styles.historyRow, idx === detail.qcChecks.length - 1 && { borderBottomWidth: 0 }]}>
                <Ionicons
                  name={c.passed ? "checkmark-circle" : "close-circle"}
                  size={18}
                  color={c.passed ? COLORS.success : COLORS.danger}
                />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>{QC_CHECK_LABEL[c.checkType] ?? c.checkType}</Text>
                  {c.note ? <Text style={styles.historyNote}>{c.note}</Text> : null}
                  <Text style={styles.historyMeta}>
                    {c.userName ?? "-"} · {formatRelativeTime(c.createdAt)}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.scanAgainBtn} onPress={() => router.back()}>
          <Text style={styles.scanAgainText}>← Kembali</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
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
  woCode: {
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
  statGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statCell: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.textPrimary,
    fontVariant: ["tabular-nums"],
  },
  statLabel: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: "500",
  },
  productLine: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  soCode: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginTop: 12,
    marginBottom: 8,
  },
  segRow: {
    flexDirection: "row",
    gap: 8,
  },
  segBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingVertical: 10,
    alignItems: "center",
  },
  segBtnText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  segBtnTextActive: {
    color: "#ffffff",
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.textPrimary,
    marginTop: 12,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 14,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  emptyHistoryText: {
    fontSize: 12.5,
    color: COLORS.textMuted,
  },
  historyRow: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bg,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  historyNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  historyMeta: {
    fontSize: 10.5,
    color: COLORS.textMuted,
    marginTop: 4,
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
