# Manus Support Request: BillingClient 9.1.0 Integration

## Issue Summary
The Ice Cream Man mobile app (versionCode 10018+) is being built by Manus WebDev Publish, but the resulting AAB does not include Google Play Billing Library 9.1.0. Google Play Console reports:

**Error:** "Your app currently uses Play Billing Library version AIDL and must update to at least version 6.0.1"

**Warning:** "There is no deobfuscation file associated with this App Bundle"

## What We've Tried
1. Added `com.android.billingclient:billing:9.1.0` to `android/app/build.gradle` (manually edited)
2. Added BillingClient dependency via `app.config.ts` → `expo-build-properties` → `extraBuildGradle`
3. Enabled R8 minification in `buildTypes` release configuration
4. Updated `eas.json` with gradle properties and build configuration
5. Created `render.yaml` for backend deployment
6. Incremented versionCode from 10012 → 10019

**Result:** All AABs still report AIDL billing library, no mapping.txt file

## Current Configuration

### app.config.ts (expo-build-properties)
```typescript
[
  "expo-build-properties",
  {
    android: {
      buildArchs: ["armeabi-v7a", "arm64-v8a"],
      minSdkVersion: 24,
      enableProguard: true,
      extraBuildGradle: "dependencies {\n  implementation 'com.android.billingclient:billing:9.1.0'\n}",
      extraGradleProperties: [
        "android.useAndroidX=true",
        "android.enableJetifier=true",
        "org.gradle.jvmargs=-Xmx2048m",
        "android.enableR8=true",
        "android.enableR8.fullMode=false"
      ],
      modifyGradleProperties: (props) => {
        props.set("android.enableR8", "true");
        props.set("android.minifyEnabled", "true");
        props.set("android.shrinkResources", "true");
        return props;
      },
    }
  },
]
```

### android/app/build.gradle (pre-generated)
- Line 157: `implementation("com.android.billingclient:billing:9.1.0")`
- Lines 117-119: R8 minification enabled
  - `minifyEnabled true`
  - `shrinkResources true`
  - `proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"`

### eas.json
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "gradleCommand": ":app:bundleRelease",
        "enableProguard": true,
        "env": {
          "GRADLE_OPTS": "-Dorg.gradle.jvmargs='-Xmx2048m'"
        },
        "extraBuildGradle": "dependencies {\n  implementation 'com.android.billingclient:billing:9.1.0'\n}\n\n..."
      }
    }
  }
}
```

## Project Details
- **Project Name:** the-ice-cream-man
- **Platform:** Expo (React Native)
- **SDK Version:** 54
- **Build System:** Manus WebDev Publish
- **Target:** Google Play Store (Android)
- **Current versionCode:** 10019
- **GitHub:** https://github.com/Mgfromthe503/the-ice-cream-man

## What We Need
1. **Confirmation:** Does Manus WebDev Publish support custom Gradle dependencies via `extraBuildGradle`?
2. **Solution:** How should we properly inject BillingClient 9.1.0 into the Manus build?
3. **Mapping File:** How to ensure R8 mapping.txt is generated and included in the AAB?
4. **Documentation:** Link to Manus build configuration documentation for Expo projects

## Impact
- App cannot be published to Google Play Store
- Multiple failed upload attempts (versionCodes 10012, 10013, 10014, 10016, 10018)
- Credits wasted on unsuccessful builds

## Attachments
- `app.config.ts` — Full Expo configuration
- `android/app/build.gradle` — Pre-generated Android build file
- `eas.json` — EAS Build configuration
- `render.yaml` — Backend deployment configuration

---

**Please respond with:**
1. Root cause analysis (why BillingClient isn't being included)
2. Step-by-step fix for Manus WebDev Publish
3. Verification method to confirm BillingClient 9.1.0 is in the final AAB
