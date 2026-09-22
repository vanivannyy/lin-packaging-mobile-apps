import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";
import type { Material } from "@/lib/types";

const CATEGORY_LABEL: Record<string, string> = {
  PAPER: "Paper",
  FILM: "Film",
  FOIL: "Foil",
  INK: "Ink",
  OTHER: "Other",
};

function StockBadge({ isLow }: { isLow: boolean }) {
  return (
    <View style={[styles.badge, isLow ? styles.badgeDanger : styles.badgeOk]}>
      <Text style={[styles.badgeText, isLow ? styles.badgeDangerText : styles.badgeOkText]}>
        {isLow ? "⚠ Stok Rendah" : "● Stok Normal"}
      </Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

export default function MaterialDetailScreen() {
  const { id, sku } = useLocalSearchParams<{ id: string; sku: string }>();
  const router = useRouter();
  const headerHeight = useHeaderHeight();
  const scrollRef = useRef<ScrollView>(null);
  const adjustSectionY = useRef(0);

  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReference, setAdjustReference] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  const fetchMaterial = useCallback(async () => {
    if (!sku) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await api.getMaterialBySku(sku);
      setMaterial(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Gagal memuat material");
    } finally {
      setLoading(false);
    }
  }, [sku]);

  useEffect(() => {
    fetchMaterial();
  }, [fetchMaterial]);

  function scrollToAdjustSection(offset = 0) {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, adjustSectionY.current + offset),
        animated: true,
      });
    }, Platform.OS === "ios" ? 100 : 250);
  }

  async function handleAdjust() {
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty === 0) {
      Alert.alert("Error", "Jumlah tidak boleh 0");
      return;
    }
    if (!id) return;

    setAdjusting(true);
    try {
      const updated = await api.adjustStock(
        id,
        qty,
        adjustNote.trim() || undefined,
        adjustReference.trim() || undefined,
      );
      setMaterial((prev) =>
        prev
          ? {
              ...prev,
              stockQty: updated.stockQty,
              reservedQty: updated.reservedQty,
              available: updated.available,
              isLow: updated.isLow,
            }
          : prev,
      );
      setAdjustQty("");
      setAdjustReference("");
      setAdjustNote("");
      Alert.alert(
        "Berhasil",
        `Stok ${updated.name} diperbarui.\nStok tersedia: ${updated.available} ${material?.unit ?? ""}`,
        [
          { text: "Scan Lagi", onPress: () => router.back() },
          { text: "Tetap di Sini", style: "cancel" },
        ],
      );
    } catch (err) {
      Alert.alert("Gagal", err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setAdjusting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1e40af" />
        <Text style={styles.loadingText}>Memuat material...</Text>
      </View>
    );
  }

  if (fetchError || !material) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{fetchError ?? "Material tidak ditemukan"}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchMaterial}>
          <Text style={styles.retryText}>Coba Lagi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPositive = parseFloat(adjustQty) > 0;
  const isNegative = parseFloat(adjustQty) < 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive"
      >
      <View style={styles.materialCard}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.materialName}>{material.name}</Text>
            <Text style={styles.materialSku}>{material.sku}</Text>
          </View>
          <StockBadge isLow={material.isLow} />
        </View>

        <View style={styles.divider} />

        <View style={styles.stockGrid}>
          <View style={styles.stockCell}>
            <Text style={styles.stockNumber}>{material.stockQty}</Text>
            <Text style={styles.stockLabel}>Total Stok</Text>
          </View>
          <View style={styles.stockCell}>
            <Text style={styles.stockNumber}>{material.reservedQty}</Text>
            <Text style={styles.stockLabel}>Reserved</Text>
          </View>
          <View style={[styles.stockCell, material.isLow && styles.stockCellDanger]}>
            <Text style={[styles.stockNumber, material.isLow && styles.stockNumberDanger]}>
              {material.available}
            </Text>
            <Text style={styles.stockLabel}>Tersedia</Text>
          </View>
          <View style={styles.stockCell}>
            <Text style={styles.stockNumber}>{material.minStockQty}</Text>
            <Text style={styles.stockLabel}>Min. Stok</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <InfoRow label="Kategori" value={CATEGORY_LABEL[material.category] ?? material.category} />
        <InfoRow label="Unit" value={material.unit} />
        <InfoRow label="GSM" value={material.gsm} />
        <InfoRow label="Ukuran" value={material.size} />
        <InfoRow label="Supplier" value={material.supplier?.name} />
      </View>

      <View
        style={styles.adjustCard}
        onLayout={(event) => {
          adjustSectionY.current = event.nativeEvent.layout.y;
        }}
      >
        <Text style={styles.adjustTitle}>Sesuaikan Stok</Text>
        <Text style={styles.adjustHint}>
          Gunakan angka positif untuk penambahan, negatif untuk pengurangan.
        </Text>

        <Text style={styles.inputLabel}>Jumlah (+/-)</Text>
        <TextInput
          style={[
            styles.input,
            isPositive && styles.inputPositive,
            isNegative && styles.inputNegative,
          ]}
          value={adjustQty}
          onChangeText={setAdjustQty}
          placeholder="mis. 100 atau -50"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          editable={!adjusting}
          onFocus={() => scrollToAdjustSection(80)}
          returnKeyType="next"
        />

        <Text style={styles.inputLabel}>Referensi SO/WO/DO (opsional)</Text>
        <Text style={styles.adjustHint}>
          Isi supaya pengurangan/penambahan stok ini tercatat untuk order tersebut.
        </Text>
        <TextInput
          style={styles.input}
          value={adjustReference}
          onChangeText={setAdjustReference}
          placeholder="mis. SO-2026-00001 / WO-2026-00001"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
          editable={!adjusting}
          onFocus={() => scrollToAdjustSection(130)}
          returnKeyType="next"
        />

        <Text style={styles.inputLabel}>Catatan (opsional)</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={adjustNote}
          onChangeText={setAdjustNote}
          placeholder="Alasan penyesuaian stok"
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={2}
          editable={!adjusting}
          onFocus={() => scrollToAdjustSection(180)}
          returnKeyType="done"
        />

        <TouchableOpacity
          style={[styles.adjustBtn, adjusting && styles.adjustBtnDisabled]}
          onPress={handleAdjust}
          disabled={adjusting}
          activeOpacity={0.85}
        >
          {adjusting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.adjustBtnText}>Simpan Penyesuaian</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.scanAgainBtn} onPress={() => router.back()}>
          <Text style={styles.scanAgainText}>← Scan Barcode Lain</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 280,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
  },
  loadingText: {
    color: "#64748b",
    marginTop: 8,
  },
  errorText: {
    color: "#dc2626",
    textAlign: "center",
    fontSize: 15,
  },
  retryBtn: {
    backgroundColor: "#1e40af",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
  },
  backBtn: {
    paddingVertical: 10,
  },
  backText: {
    color: "#64748b",
    fontWeight: "600",
  },
  materialCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  materialName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e293b",
    flexShrink: 1,
  },
  materialSku: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "600",
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  badgeOk: {
    backgroundColor: "#dcfce7",
  },
  badgeDanger: {
    backgroundColor: "#fee2e2",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  badgeOkText: {
    color: "#16a34a",
  },
  badgeDangerText: {
    color: "#dc2626",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 14,
  },
  stockGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  stockCell: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stockCellDanger: {
    backgroundColor: "#fff1f2",
  },
  stockNumber: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1e293b",
    fontVariant: ["tabular-nums"],
  },
  stockNumberDanger: {
    color: "#dc2626",
  },
  stockLabel: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 3,
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 13,
    color: "#1e293b",
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "right",
  },
  adjustCard: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  adjustTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  adjustHint: {
    fontSize: 12,
    color: "#64748b",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: "#1e293b",
    marginBottom: 8,
  },
  inputPositive: {
    borderColor: "#22c55e",
    backgroundColor: "#f0fdf4",
  },
  inputNegative: {
    borderColor: "#f97316",
    backgroundColor: "#fff7ed",
  },
  inputMultiline: {
    minHeight: 64,
    textAlignVertical: "top",
  },
  adjustBtn: {
    backgroundColor: "#1e40af",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  adjustBtnDisabled: {
    opacity: 0.6,
  },
  adjustBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  scanAgainBtn: {
    alignItems: "center",
    paddingVertical: 14,
  },
  scanAgainText: {
    color: "#3b82f6",
    fontWeight: "600",
    fontSize: 14,
  },
});
