import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// ─── CHANGE THESE VALUES TO UPDATE THE APP ───────────────────────────────────
const APP_NAME = "The Ice Cream Man";
const APP_SLUG = "the-ice-cream-man";
const BUNDLE_ID = "com.icecreamman.app";
const VERSION = "1.0.22";
const VERSION_CODE = 23; // Increment this by 1 for every Play Store upload
const DEEP_LINK_SCHEME = "icecreamman";
// ─────────────────────────────────────────────────────────────────────────────

const config: ExpoConfig = {
  name: APP_NAME,
  slug: APP_SLUG,
  version: VERSION,
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: DEEP_LINK_SCHEME,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  extra: {
    eas: {
      projectId: "a7392ba6-c4a2-455d-b03c-9bc0233b7b12",
    },
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_ID,
    infoPlist: { ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: BUNDLE_ID,
    versionCode: VERSION_CODE,
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    permissions: [
      "POST_NOTIFICATIONS",
      "com.android.vending.BILLING",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
    ],
    queries: {
      schemes: ["google.navigation", "geo", "comgooglemaps"],
      packages: ["com.google.android.apps.maps"],
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: DEEP_LINK_SCHEME, host: "*" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-web-browser",
    // Google Play Billing (vendor registration). Requires a dev client / EAS build.
    "expo-iap",
    // Custom plugin: injects BillingClient 7.0.0 dependency + ProGuard rules
    "./plugins/withBillingClient",
    [
      "expo-location",
      {
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: { backgroundColor: "#000000" },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
          compileSdkVersion: 36,
          targetSdkVersion: 36,
          buildToolsVersion: "36.0.0",
          kotlinVersion: "2.1.20",
          enableProguardInReleaseBuilds: true,
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          // Google Play Billing Library version 7.0.0
          billingLibraryVersion: "7.0.0",
          extraProguardRules: `
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod
-keepclasseswithmembernames class * { native <methods>; }
-dontwarn com.margelo.nitro.**
-keep class com.margelo.nitro.** { *; }
-dontwarn com.dooboolab.rniap.**
-keep class com.dooboolab.rniap.** { *; }
`,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
