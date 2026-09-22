import { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  AppState,
  AppStateStatus,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/lib/theme";

const CORNER_SIZE = 24;
const CORNER_WIDTH = 3;
const COOLDOWN_MS = 2000;

/**
 * Layar scanner full-screen untuk barcode material (tab Gudang).
 * Scan SO / WO / DO sudah tidak dipakai — nomor diisi manual.
 */
export function BarcodeScannerView({
  title,
  subtitle,
  manualPlaceholder = "Ketik kode manual",
  onSubmit,
}: {
  title: string;
  subtitle?: string;
  manualPlaceholder?: string;
  onSubmit: (code: string) => Promise<void>;
}) {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [cameraKey, setCameraKey] = useState(0);
  const lastScannedRef = useRef<string | null>(null);
  const cooldownRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);

  // Fix bug: kamera jadi layar hitam kalau app dibiarkan di background
  // (buka app lain) cukup lama lalu dibuka lagi. Ini terjadi karena OS
  // (terutama Android) bisa me-release native camera session, tapi
  // CameraView tetap ter-mount sehingga preview tidak otomatis restart.
  // Solusinya: saat app kembali ke "active" setelah sempat
  // background/inactive, ganti `key` CameraView agar remount total dan
  // sesi kamera native diinisialisasi ulang dari awal.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === "active") {
        setCameraKey((prev) => prev + 1);
        lastScannedRef.current = null;
        cooldownRef.current = false;
        setErrorMsg(null);
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, []);

  const submit = useCallback(
    async (code: string) => {
      const trimmed = code.trim();
      if (!trimmed) return;
      setProcessing(true);
      setErrorMsg(null);
      try {
        await onSubmit(trimmed);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Kode tidak dikenali");
        setTimeout(() => {
          lastScannedRef.current = null;
        }, COOLDOWN_MS);
      } finally {
        setProcessing(false);
      }
    },
    [onSubmit],
  );

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (cooldownRef.current || processing) return;
      if (data === lastScannedRef.current) return;
      cooldownRef.current = true;
      lastScannedRef.current = data;
      submit(data).finally(() => {
        setTimeout(() => {
          cooldownRef.current = false;
        }, COOLDOWN_MS);
      });
    },
    [submit, processing],
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Izin kamera diperlukan untuk memindai barcode</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Izinkan Kamera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <CameraView
        key={cameraKey}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["code128"] }}
        onBarcodeScanned={processing ? undefined : handleBarcodeScanned}
        onMountError={(e) => setErrorMsg(e.message || "Kamera gagal dimulai, coba lagi")}
      />

      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.topTitle}>{title}</Text>
            {subtitle ? <Text style={styles.topSubtitle}>{subtitle}</Text> : null}
          </View>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
        </View>

        <View style={styles.bottomBar}>
          {processing ? (
            <View style={styles.statusRow}>
              <ActivityIndicator color="#ffffff" size="small" />
              <Text style={styles.statusText}>Memproses…</Text>
            </View>
          ) : errorMsg ? (
            <View style={[styles.statusRow, styles.errorRow]}>
              <Text style={styles.errorStatusText}>⚠ {errorMsg}</Text>
            </View>
          ) : (
            <Text style={styles.hintText}>Arahkan kamera ke barcode, atau ketik manual</Text>
          )}

          <View style={styles.manualRow}>
            <TextInput
              style={styles.manualInput}
              value={manualCode}
              onChangeText={setManualCode}
              placeholder={manualPlaceholder}
              placeholderTextColor="rgba(255,255,255,0.5)"
              autoCapitalize="characters"
              editable={!processing}
              onSubmitEditing={() => submit(manualCode)}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.manualBtn}
              onPress={() => submit(manualCode)}
              disabled={processing || !manualCode.trim()}
            >
              <Ionicons name="search" size={18} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 16,
    backgroundColor: COLORS.bg,
  },
  permissionText: {
    fontSize: 15,
    textAlign: "center",
    color: "#374151",
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  permissionButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  backLink: {
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 18,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  topSubtitle: {
    color: "#cbd5e1",
    fontSize: 12,
    marginTop: 2,
  },
  scanArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 260,
    height: 130,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#ffffff",
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_WIDTH, borderRightWidth: CORNER_WIDTH, borderBottomRightRadius: 4 },
  bottomBar: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    paddingTop: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    gap: 14,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorRow: {
    backgroundColor: "rgba(220,38,38,0.25)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statusText: {
    color: "#ffffff",
    fontSize: 14,
  },
  errorStatusText: {
    color: "#fca5a5",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  hintText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    textAlign: "center",
  },
  manualRow: {
    flexDirection: "row",
    width: "100%",
    gap: 8,
  },
  manualInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 14,
  },
  manualBtn: {
    width: 44,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
  },
});
