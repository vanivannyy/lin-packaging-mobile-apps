import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationsProvider } from "@/lib/notifications-context";
import { COLORS } from "@/lib/theme";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NotificationsProvider>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: COLORS.primary },
              headerTintColor: "#ffffff",
              headerTitleStyle: { fontWeight: "700" },
              contentStyle: { backgroundColor: COLORS.bg },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="material/[id]" options={{ title: "Detail Material" }} />
            <Stack.Screen name="notifikasi" options={{ title: "Notifikasi" }} />
            <Stack.Screen name="order-detail/[code]" options={{ title: "Detail Order" }} />
            <Stack.Screen name="order-ship/[code]" options={{ title: "Kirim Pesanan" }} />
            <Stack.Screen name="order-scan-check" options={{ headerShown: false }} />
            <Stack.Screen name="order-scan-ship" options={{ headerShown: false }} />
            <Stack.Screen name="qc-detail/[code]" options={{ title: "Inspeksi QC" }} />
            <Stack.Screen name="qc-scan" options={{ headerShown: false }} />
          </Stack>
        </NotificationsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
