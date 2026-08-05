import "react-native-reanimated";
import React, { useEffect } from "react";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SystemBars } from "react-native-edge-to-edge";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Alert } from "react-native";
import { useNetworkState } from "expo-network";
import {
  DarkTheme,
  Theme,
  ThemeProvider,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { WidgetProvider } from "@/contexts/WidgetContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Only wrap with ErrorBoundary in dev — production apps should not include it
const DevErrorBoundary = __DEV__
  ? ErrorBoundary
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "auth";
    if (!user && !inAuthGroup) {
      console.log("[AuthGuard] No user, redirecting to /auth");
      router.replace("/auth");
    } else if (user && inAuthGroup) {
      console.log("[AuthGuard] User authenticated, redirecting to home");
      router.replace("/(tabs)/(home)");
    }
  }, [user, loading, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const networkState = useNetworkState();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  React.useEffect(() => {
    if (
      !networkState.isConnected &&
      networkState.isInternetReachable === false
    ) {
      Alert.alert(
        "You are offline",
        "You can keep using the app! Your changes will be saved locally and synced when you are back online."
      );
    }
  }, [networkState.isConnected, networkState.isInternetReachable]);

  const CustomDarkTheme: Theme = {
    ...DarkTheme,
    colors: {
      primary: "#C0392B",
      background: "#0D0D0D",
      card: "#1A1A1A",
      text: "#F5F0EB",
      border: "rgba(255,255,255,0.08)",
      notification: "#C0392B",
    },
  };

  return (
    <DevErrorBoundary>
      <StatusBar style="light" animated />
      <ThemeProvider value={CustomDarkTheme}>
        <SafeAreaProvider>
          <AuthProvider>
            <WidgetProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <AuthGuard>
                  <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="auth" options={{ headerShown: false }} />
                    <Stack.Screen name="upload" options={{ headerShown: false }} />
                    <Stack.Screen name="interview" options={{ headerShown: false }} />
                    <Stack.Screen name="render-progress" options={{ headerShown: false }} />
                    <Stack.Screen name="trailer" options={{ headerShown: false }} />
                    <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
                    <Stack.Screen name="poster" options={{ headerShown: false }} />
                    <Stack.Screen name="share" options={{ headerShown: false }} />
                    <Stack.Screen name="profile" options={{ headerShown: false }} />
                  </Stack>
                </AuthGuard>
                <SystemBars style="light" />
              </GestureHandlerRootView>
            </WidgetProvider>
          </AuthProvider>
        </SafeAreaProvider>
      </ThemeProvider>
    </DevErrorBoundary>
  );
}
