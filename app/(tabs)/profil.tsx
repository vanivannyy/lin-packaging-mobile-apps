import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { Logo } from "@/components/Logo";
import { COLORS, RADIUS, SHADOW } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Owner",
  SALES_MANAGER: "Sales Manager",
  SALES: "Sales",
  FINANCE: "Finance",
  WAREHOUSE: "Warehouse",
  QC: "Quality Control",
  PURCHASING: "Purchasing",
  PRODUCTION_PLANNER: "Production Planner",
  GENERAL_MANAGER: "General Manager",
  DESIGN: "Design",
};

function MenuRow({
  icon,
  label,
  onPress,
  danger,
  badge,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  badge?: number;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIconWrap, danger && styles.menuIconWrapDanger]}>
        <Ionicons name={icon} size={16} color={danger ? COLORS.danger : COLORS.primary} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.menuLabelDanger]}>{label}</Text>
      {badge ? (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge > 9 ? "9+" : badge}</Text>
        </View>
      ) : null}
      {!danger ? <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} /> : null}
    </TouchableOpacity>
  );
}

export default function ProfilScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const appVersion = Constants.expoConfig?.version ?? "1.0.0";

  function handleLogout() {
    Alert.alert("Keluar", "Yakin ingin keluar dari aplikasi?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: logout },
    ]);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarInitial}>{(user?.name ?? "?").charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name}</Text>
          <Text style={styles.profileCode}>{user?.code}</Text>
          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{ROLE_LABEL[user?.role ?? ""] ?? user?.role}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Aplikasi</Text>
        <View style={styles.menuCard}>
          <MenuRow icon="notifications" label="Notifikasi" badge={unreadCount} onPress={() => router.push("/notifikasi")} />
          <View style={styles.menuDivider} />
          <MenuRow
            icon="key"
            label="Modul yang bisa diakses"
            onPress={() =>
              Alert.alert(
                "Akses Modul",
                user?.modules?.includes("*")
                  ? "Role Anda memiliki akses ke seluruh modul (Owner)."
                  : (user?.modules ?? []).join(", ") || "Tidak ada modul.",
              )
            }
          />
          <View style={styles.menuDivider} />
          <MenuRow
            icon="information-circle"
            label="Tentang Aplikasi"
            onPress={() =>
              Alert.alert("Lin Packaging ERP Mobile", `Versi ${appVersion}\nPusat Cetak Kemasan Premium`)
            }
          />
        </View>

        <Text style={styles.sectionTitle}>Akun</Text>
        <View style={styles.menuCard}>
          <MenuRow icon="log-out" label="Keluar" onPress={handleLogout} danger />
        </View>

        <View style={styles.footer}>
          <Logo size={36} />
          <Text style={styles.footerText}>Lin Packaging · ERP Mobile v{appVersion}</Text>
        </View>
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
  body: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: 22,
    alignItems: "center",
    marginTop: -8,
    ...SHADOW.card,
  },
  avatarWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarInitial: {
    color: "#ffffff",
    fontSize: 26,
    fontWeight: "800",
  },
  profileName: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.textPrimary,
  },
  profileCode: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  rolePill: {
    marginTop: 10,
    backgroundColor: COLORS.accentSoft,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rolePillText: {
    color: COLORS.warning,
    fontSize: 11.5,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginTop: 22,
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  menuCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    ...SHADOW.card,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuDivider: {
    height: 1,
    backgroundColor: COLORS.bg,
    marginHorizontal: 16,
  },
  menuIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: COLORS.infoSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconWrapDanger: {
    backgroundColor: COLORS.dangerSoft,
  },
  menuLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  menuLabelDanger: {
    color: COLORS.danger,
  },
  menuBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginRight: 4,
  },
  menuBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#101426",
  },
  footer: {
    alignItems: "center",
    marginTop: 32,
    gap: 8,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
