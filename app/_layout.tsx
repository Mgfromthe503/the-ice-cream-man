import "@/global.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { Platform } from "react-native";
import "@/lib/_core/nativewind-pressable";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { LocationProvider } from "@/lib/location-context";
import { RequestProvider } from "@/lib/request-context";
import { useAppStore, selectUserRole, selectIsAppReady } from "@/lib/store";
import { createQueryClient } from "@/lib/query-config";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  SafeAreaProvider,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import type { EdgeInsets, Metrics, Rect } from "react-native-safe-area-context";

import { trpc, createTRPCClient } from "@/lib/trpc";
import { initManusRuntime, subscribeSafeAreaInsets } from "@/lib/_core/manus-runtime";
// RatingsPrompt is now triggered from delivery completion flow, not globally

const DEFAULT_WEB_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };
const DEFAULT_WEB_FRAME: Rect = { x: 0, y: 0, width: 0, height: 0 };

export const unstable_settings = {
  anchor: "(tabs)",
};

/**
 * Protected Routing with Auth State Evaluation
 * 
 * On launch, the app evaluates the user's persisted state (from Zustand store)
 * and redirects them cleanly:
 * - No role → role-select screen
 * - Customer role → customer dashboard
 * - Driver role → driver dashboard (with registration/payment gate)
 * - OAuth callback → handled separately
 * 
 * This prevents flash of wrong content and ensures clean navigation.
 */
function RootLayoutNav() {
  const { userRole, isLoading } = useAuth();
  const storeRole = useAppStore(selectUserRole);
  const setAppReady = useAppStore((s) => s.setAppReady);
  const segments = useSegments();
  const router = useRouter();

  // Mark app as ready once store is hydrated and auth is resolved
  useEffect(() => {
    if (!isLoading) {
      setAppReady(true);
    }
  }, [isLoading, setAppReady]);

  useEffect(() => {
    if (isLoading) return;

    // Use the effective role (auth context takes priority, fallback to store)
    const effectiveRole = userRole || storeRole;
    const inAuthGroup = segments[0] === "(customer)" || segments[0] === "(driver)";

    if (!effectiveRole && inAuthGroup) {
      router.replace("/role-select");
    } else if (!effectiveRole && segments[0] === "(tabs)") {
      // First app open — show role selection (no login required)
      router.replace("/role-select");
    } else if (effectiveRole && !inAuthGroup && segments[0] !== "oauth" && segments[0] !== "login") {
      if (effectiveRole === "customer") {
        router.replace("/(customer)");
      } else if (effectiveRole === "driver") {
        router.replace("/(driver)");
      }
    }
  }, [userRole, storeRole, segments, isLoading]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="login" />
        <Stack.Screen name="role-select" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="oauth/callback" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const initialInsets = initialWindowMetrics?.insets ?? DEFAULT_WEB_INSETS;
  const initialFrame = initialWindowMetrics?.frame ?? DEFAULT_WEB_FRAME;

  const [insets, setInsets] = useState<EdgeInsets>(initialInsets);
  const [frame, setFrame] = useState<Rect>(initialFrame);

  // Initialize Manus runtime for cookie injection from parent container
  useEffect(() => {
    initManusRuntime();
  }, []);

  const handleSafeAreaUpdate = useCallback((metrics: Metrics) => {
    setInsets(metrics.insets);
    setFrame(metrics.frame);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const unsubscribe = subscribeSafeAreaInsets(handleSafeAreaUpdate);
    return () => unsubscribe();
  }, [handleSafeAreaUpdate]);

  // Create optimized query client once — uses production config from query-config.ts
  // Separates server data (TanStack Query) from local UI state (Zustand)
  // This ensures UI stays responsive during heavy API calls
  const [queryClient] = useState(() => createQueryClient());
  const [trpcClient] = useState(() => createTRPCClient());

  // Ensure minimum 8px padding for top and bottom on mobile
  const providerInitialMetrics = useMemo(() => {
    const metrics = initialWindowMetrics ?? { insets: initialInsets, frame: initialFrame };
    return {
      ...metrics,
      insets: {
        ...metrics.insets,
        top: Math.max(metrics.insets.top, 16),
        bottom: Math.max(metrics.insets.bottom, 12),
      },
    };
  }, [initialInsets, initialFrame]);

  const content = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <LocationProvider>
              <RequestProvider>
                <RootLayoutNav />
                <StatusBar style="auto" />
              </RequestProvider>
            </LocationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </GestureHandlerRootView>
  );

  const shouldOverrideSafeArea = Platform.OS === "web";

  if (shouldOverrideSafeArea) {
    return (
      <ThemeProvider>
        <SafeAreaProvider initialMetrics={providerInitialMetrics}>
          <SafeAreaFrameContext.Provider value={frame}>
            <SafeAreaInsetsContext.Provider value={insets}>
              {content}
            </SafeAreaInsetsContext.Provider>
          </SafeAreaFrameContext.Provider>
        </SafeAreaProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider initialMetrics={providerInitialMetrics}>{content}</SafeAreaProvider>
    </ThemeProvider>
  );
}
