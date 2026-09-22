import { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Redirect } from "expo-router";
import { Logo } from "@/components/Logo";
import { COLORS } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";

const MIN_SPLASH_MS = 2200;

export default function SplashScreen() {
  const { user, isLoading } = useAuth();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();

    Animated.timing(lineWidth, {
      toValue: 1,
      duration: 1400,
      delay: 350,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [fade, scale, lineWidth]);

  const ready = minTimeElapsed && !isLoading;

  if (ready) {
    return <Redirect href={user ? "/(tabs)/home" : "/login"} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.decorTop} />
      <View style={styles.decorBottom} />

      <Animated.View
        style={[styles.center, { opacity: fade, transform: [{ scale }] }]}
      >
        <View style={styles.logoWrap}>
          <Logo size={104} />
        </View>
        <Text style={styles.brand}>Lin Packaging</Text>
        <Text style={styles.tagline}>Pusat Cetak Kemasan Premium</Text>

        <View style={styles.lineTrack}>
          <Animated.View
            style={[
              styles.lineFill,
              {
                width: lineWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.loadingText}>Menyiapkan ERP Mobile…</Text>
      </Animated.View>

      <Text style={styles.footer}>ERP Mobile · Lin Packaging</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  decorTop: {
    position: "absolute",
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.primarySoft,
    opacity: 0.5,
  },
  decorBottom: {
    position: "absolute",
    bottom: -140,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.primarySoft,
    opacity: 0.35,
  },
  center: {
    alignItems: "center",
  },
  logoWrap: {
    width: 132,
    height: 132,
    borderRadius: 66,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  brand: {
    fontSize: 26,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: 0.2,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.accent,
    fontWeight: "600",
    marginTop: 4,
    letterSpacing: 0.4,
  },
  lineTrack: {
    width: 120,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginTop: 36,
    overflow: "hidden",
  },
  lineFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
  },
  footer: {
    position: "absolute",
    bottom: 36,
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 0.4,
  },
});
