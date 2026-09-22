import { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications-context";
import { hasModule } from "@/lib/types";
import { COLORS } from "@/lib/theme";

export default function TabsLayout() {
  const { user, isLoading } = useAuth();
  const { unreadCount, refresh } = useNotifications();

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  const canOrder = hasModule(user, "sales-order") || hasModule(user, "delivery") || hasModule(user, "produksi");
  const canGudang = hasModule(user, "material-stok");
  const canQc = hasModule(user, "produksi");

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: { height: 62, paddingBottom: 8, paddingTop: 6, borderTopColor: COLORS.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Beranda",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="order"
        options={{
          href: canOrder ? undefined : null,
          title: "Order",
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="gudang"
        options={{
          href: canGudang ? undefined : null,
          title: "Gudang",
          tabBarIcon: ({ color, size }) => <Ionicons name="cube" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="qc"
        options={{
          href: canQc ? undefined : null,
          title: "QC",
          tabBarIcon: ({ color, size }) => <Ionicons name="checkmark-done-circle" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
          tabBarBadge: unreadCount > 0 ? (unreadCount > 9 ? "9+" : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: COLORS.accent, color: "#101426", fontSize: 10 },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.bg,
  },
});
