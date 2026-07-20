/**
 * Google Play Billing Integration — react-native-iap v12
 *
 * Handles the $25 one-time Ice Cream Man vendor registration fee
 * via Google Play Billing Library 6.x (required by Google as of 2024).
 *
 * MONEY FLOW:
 * 1. Driver pays $25 via Google Play Billing
 * 2. Google takes 15% ($3.75) as their platform fee
 * 3. Developer receives $21.25 in their Google Play Developer account
 *
 * SETUP REQUIRED (in Google Play Console):
 * 1. Go to Google Play Console → Your App → Monetize → Products → In-app products
 * 2. Create a product with ID: "icm_vendor_registration"
 * 3. Set price: $25.00 | Type: "One-time" (non-consumable) | Activate it
 *
 * CASHING OUT:
 * - Google Play Console → Download reports → Financial
 * - Or set up automatic payouts in Settings → Developer account → Payment settings
 */

import { Platform } from 'react-native';
import { validatePurchaseToken, createSecureReceipt, isRateLimited } from './security';

export const VENDOR_REGISTRATION_PRODUCT_ID = 'icm_vendor_registration';
export const REGISTRATION_PRICE = 25.00;
export const GOOGLE_CUT_PERCENT = 15;
export const DEVELOPER_RECEIVES = REGISTRATION_PRICE * (1 - GOOGLE_CUT_PERCENT / 100);

export interface PurchaseResult {
  success: boolean;
  transactionId: string | null;
  purchaseToken: string | null;
  error?: string;
}

export interface BillingState {
  isReady: boolean;
  isPurchasing: boolean;
  isPurchased: boolean;
  error: string | null;
}

type PendingPurchase = {
  resolve: (value: PurchaseResult) => void;
  timer: ReturnType<typeof setTimeout>;
};

let connected = false;
let updateSub: { remove?: () => void } | null = null;
let errorSub: { remove?: () => void } | null = null;
let pending: PendingPurchase | null = null;

async function loadIap() {
  return import('react-native-iap');
}

function settlePending(result: PurchaseResult): void {
  if (!pending) return;
  const { resolve, timer } = pending;
  pending = null;
  clearTimeout(timer);
  resolve(result);
}

function isPendingPurchase(purchase: any): boolean {
  return purchase?.purchaseState === 'pending' || purchase?.purchaseState === 2;
}

async function ensureListeners(): Promise<void> {
  const iap = await loadIap();

  if (!updateSub) {
    updateSub = iap.purchaseUpdatedListener(async (purchase: any) => {
      if (purchase.productId !== VENDOR_REGISTRATION_PRODUCT_ID) return;

      if (isPendingPurchase(purchase)) {
        settlePending({
          success: false,
          transactionId: null,
          purchaseToken: null,
          error: 'Google Play is still processing this payment. Reopen the app after the payment completes and use Restore Purchase.',
        });
        return;
      }

      const token = purchase.purchaseToken ?? null;
      const transactionId = purchase.id ?? purchase.transactionId ?? null;

      if (!token || !validatePurchaseToken(token)) {
        settlePending({ success: false, transactionId: null, purchaseToken: null, error: 'Google Play returned an invalid purchase token.' });
        return;
      }

      try {
        await createSecureReceipt(transactionId ?? `google_${Date.now()}`, VENDOR_REGISTRATION_PRODUCT_ID, token);
        await iap.finishTransaction({ purchase, isConsumable: false });
        settlePending({ success: true, transactionId, purchaseToken: token });
      } catch (error: any) {
        settlePending({ success: false, transactionId: null, purchaseToken: null, error: error?.message ?? 'Could not finish the Google Play transaction.' });
      }
    });
  }

  if (!errorSub) {
    errorSub = iap.purchaseErrorListener((error: any) => {
      const cancelled = ['user-cancelled', 'user_cancelled', 'E_USER_CANCELLED'].includes(error?.code);
      settlePending({
        success: false,
        transactionId: null,
        purchaseToken: null,
        error: cancelled ? 'Purchase cancelled by user' : (error?.message ?? 'Purchase failed'),
      });
    });
  }
}

export async function initializeBilling(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const iap = await loadIap();
    connected = Boolean(await iap.initConnection());
    await ensureListeners();
    return connected;
  } catch (error) {
    console.error('[Billing] init failed', error);
    connected = false;
    return false;
  }
}

export async function getRegistrationProduct(): Promise<any | null> {
  if (Platform.OS !== 'android') return null;
  try {
    if (!connected && !(await initializeBilling())) return null;
    const iap = await loadIap();
    const products = await iap.fetchProducts({ skus: [VENDOR_REGISTRATION_PRODUCT_ID], type: 'in-app' });
    return products?.[0] ?? null;
  } catch (error) {
    console.error('[Billing] product query failed', error);
    return null;
  }
}

export async function purchaseRegistration(): Promise<PurchaseResult> {
  if (Platform.OS !== 'android') {
    return { success: false, transactionId: null, purchaseToken: null, error: 'Google Play Billing is only available in the Android app installed from a Play testing or production track.' };
  }
  if (isRateLimited('purchase_registration', 3, 60_000)) {
    return { success: false, transactionId: null, purchaseToken: null, error: 'Too many purchase attempts. Wait a moment and try again.' };
  }
  if (!connected && !(await initializeBilling())) {
    return { success: false, transactionId: null, purchaseToken: null, error: 'Could not connect to Google Play Billing.' };
  }
  const product = await getRegistrationProduct();
  if (!product) {
    return { success: false, transactionId: null, purchaseToken: null, error: 'The registration product is unavailable. Confirm that icm_vendor_registration is active in Play Console and that this build was installed from a Play testing track.' };
  }
  await ensureListeners();

  return new Promise<PurchaseResult>((resolve) => {
    settlePending({ success: false, transactionId: null, purchaseToken: null, error: 'A newer purchase attempt replaced the previous one.' });
    pending = {
      resolve,
      timer: setTimeout(() => {
        settlePending({ success: false, transactionId: null, purchaseToken: null, error: 'Google Play did not return a purchase result. Try again or use Restore Purchase.' });
      }, 120_000),
    };
    void (async () => {
      try {
        const iap = await loadIap();
        await iap.requestPurchase({
          request: {
            apple: { sku: VENDOR_REGISTRATION_PRODUCT_ID },
            google: { skus: [VENDOR_REGISTRATION_PRODUCT_ID] },
          },
          type: 'in-app',
        });
      } catch (error: any) {
        settlePending({ success: false, transactionId: null, purchaseToken: null, error: error?.message ?? 'Purchase request failed' });
      }
    })();
  });
}

export async function checkExistingPurchase(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    if (!connected && !(await initializeBilling())) return false;
    const iap = await loadIap();
    const purchases = await iap.getAvailablePurchases();
    return purchases.some((p: any) => p.productId === VENDOR_REGISTRATION_PRODUCT_ID && !isPendingPurchase(p));
  } catch (error) {
    console.error('[Billing] restore failed', error);
    return false;
  }
}

export async function endBillingConnection(): Promise<void> {
  try {
    updateSub?.remove?.();
    errorSub?.remove?.();
    updateSub = null;
    errorSub = null;
    settlePending({ success: false, transactionId: null, purchaseToken: null, error: 'Billing connection closed.' });
    if (connected) {
      const iap = await loadIap();
      await iap.endConnection();
    }
  } catch {
    // Cleanup should not block screen unmounting.
  } finally {
    connected = false;
  }
}
