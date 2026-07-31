# 🍦 Ice Cream Man — Automated Build & Deploy Setup

## What This Does
Every time you push code to GitHub `main` branch:
1. GitHub Actions triggers automatically
2. Sends your code to EAS Build (Expo's cloud build servers)
3. EAS builds a signed `.aab` file
4. Automatically submits it to Google Play Store Internal Track
5. You get notified when it's live — zero manual steps

---

## One-Time Setup: Add GitHub Secrets

You need to add 2 secrets to your GitHub repo. These are encrypted and
never visible after you save them.

### Step 1 — Open your GitHub repo secrets page
Go to:
https://github.com/Mgfromthe503/the-ice-cream-man/settings/secrets/actions
Click "New repository secret" for each one below.

---

### Secret #1 — EXPO_TOKEN
Name:  EXPO_TOKEN
Value: (your Expo access token — see below how to get it)

How to get your Expo token:
1. Go to https://expo.dev/accounts/mgfromthe503/settings/access-tokens
2. Click "Create Token"
3. Name it "GitHub Actions"
4. Copy the token value
5. Paste it as the secret value

---

### Secret #2 — GOOGLE_SERVICE_ACCOUNT_KEY
Name:  GOOGLE_SERVICE_ACCOUNT_KEY
Value: (the entire contents of your jasonkey.json file — paste the whole thing)

The value should start with:  {"type":"service_account",...}
Copy everything from jasonkey.json and paste it as the secret value.

---

## That's It!

After adding both secrets, push any change to main:

    git add -A
    git commit -m "setup: automated build pipeline"
    git push origin main

Watch it run at:
https://github.com/Mgfromthe503/the-ice-cream-man/actions

---

## To Deploy a New Version

1. Update VERSION_CODE in app.config.ts (increment by 1 each time)
2. Push to main
3. Done — build and deploy happen automatically

---

## Manual Build (if needed)
You can also trigger a build manually without pushing code:
1. Go to https://github.com/Mgfromthe503/the-ice-cream-man/actions
2. Click "Build & Deploy to Play Store"
3. Click "Run workflow"
4. Click the green "Run workflow" button

---

## Your Project Details (for reference)
- EAS Project: @mgfromthe503/the-ice-cream-man
- Bundle ID: com.icecreamman.app
- Google Project: ice-cream-man-502123
- Service Account: play-console-service-account-f@ice-cream-man-502123.iam.gserviceaccount.com
- Play Store Track: Internal (drafts, you promote to production manually)
