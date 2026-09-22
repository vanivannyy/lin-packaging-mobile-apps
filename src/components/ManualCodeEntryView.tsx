import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, RADIUS, SHADOW } from "@/lib/theme";

/**
 * Input nomor SO / WO / DO secara manual (tanpa kamera).
 * Barcode scan hanya dipakai untuk material di tab Gudang.
 */
export function ManualCodeEntryView({
  title,
  subtitle,
  placeholder = "Ketik nomor",
  submitLabel = "Cari",
  onSubmit,
}: {
  title: string;
  subtitle?: string;
  placeholder?: string;
  submitLabel?: string;
  onSubmit: (code: string) => Promise<void>;
}) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setProcessing(true);
    setErrorMsg(null);
    try {
      await onSubmit(trimmed);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Nomor tidak dikenali");
    } finally {
      setProcessing(false);
    }
  }, [code, onSubmit]);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <Text style={styles.label}>Nomor</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(value) => {
              setCode(value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!processing}
            onSubmitEditing={submit}
            returnKeyType="search"
            autoFocus
          />

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <TouchableOpacity
            style={[styles.submitBtn, (processing || !code.trim()) && styles.submitBtnDisabled]}
            onPress={submit}
            disabled={processing || !code.trim()}
            activeOpacity={0.85}
          >
            {processing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>{submitLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginTop: 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    padding: 18,
    ...SHADOW.card,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  submitBtnDisabled: {
    opacity: 0.55,
  },
  submitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
