/**
 * Global App Store — Zustand with AsyncStorage Persistence
 * 
 * Separates local UI state (Zustand) from server/async data (TanStack Query).
 * 
 * Zustand handles:
 * - User role & auth state (persisted)
 * - Driver registration state (persisted)
 * - App preferences & settings (persisted)
 * - Transient UI state (not persisted)
 * 
 * TanStack Query handles:
 * - Server requests (waiting orders, delivery status)
 * - Backend mutations (accept order, complete delivery)
 * - Cache invalidation & background refetch
 * 
 * This separation ensures the UI stays responsive even when
 * processing heavy computational payloads or complex APIs in the background.
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type UserRole = 'customer' | 'driver' | null;

export interface DriverRegistration {
  fullName: string;
  truckName: string;
  truckDescription: string;
  phoneNumber: string;
  areaCode: string;
  truckNumber: string;
}

export interface AppPreferences {
  hasSeenLocationDisclosure: boolean;
  hasSeenOnboarding: boolean;
  lastShareMode: 'exact' | 'street' | 'meetup';
  notificationsEnabled: boolean;
}

interface ActiveDelivery {
  requestId: number;
  location: string;
  acceptedAt: number;
}

// ─────────────────────────────────────────────
// Store Interface
// ─────────────────────────────────────────────

interface AppState {
  // Auth & Role (persisted)
  userRole: UserRole;
  userId: string | null;
  isAuthenticated: boolean;
  loginMethod: 'oauth' | 'test_account' | 'anonymous' | null;

  // Driver State (persisted)
  driverRegistration: DriverRegistration | null;
  driverAreaCode: string | null;
  driverTruckNumber: string | null;
  isDriverRegistered: boolean;
  isDriverPaid: boolean;

  // Preferences (persisted)
  preferences: AppPreferences;

  // Transient UI State (NOT persisted — resets on app restart)
  activeDelivery: ActiveDelivery | null;
  isAppReady: boolean;

  // Actions
  setUserRole: (role: UserRole) => void;
  setAuthenticated: (userId: string, method: 'oauth' | 'test_account' | 'anonymous') => void;
  logout: () => void;
  setDriverRegistration: (reg: DriverRegistration) => void;
  setDriverPaid: (paid: boolean) => void;
  setDriverAreaCode: (code: string) => void;
  setActiveDelivery: (delivery: ActiveDelivery | null) => void;
  updatePreferences: (prefs: Partial<AppPreferences>) => void;
  setAppReady: (ready: boolean) => void;
  reset: () => void;
}

// ─────────────────────────────────────────────
// Default State
// ─────────────────────────────────────────────

const defaultPreferences: AppPreferences = {
  hasSeenLocationDisclosure: false,
  hasSeenOnboarding: false,
  lastShareMode: 'street',
  notificationsEnabled: true,
};

const initialState = {
  userRole: null as UserRole,
  userId: null as string | null,
  isAuthenticated: false,
  loginMethod: null as AppState['loginMethod'],
  driverRegistration: null as DriverRegistration | null,
  driverAreaCode: null as string | null,
  driverTruckNumber: null as string | null,
  isDriverRegistered: false,
  isDriverPaid: false,
  preferences: defaultPreferences,
  activeDelivery: null as ActiveDelivery | null,
  isAppReady: false,
};

// ─────────────────────────────────────────────
// Store Creation
// ─────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setUserRole: (role) => set({ userRole: role }),

      setAuthenticated: (userId, method) => set({
        userId,
        loginMethod: method,
        isAuthenticated: true,
      }),

      logout: () => set({
        userRole: null,
        userId: null,
        isAuthenticated: false,
        loginMethod: null,
        activeDelivery: null,
      }),

      setDriverRegistration: (reg) => set({
        driverRegistration: reg,
        isDriverRegistered: true,
        driverAreaCode: reg.areaCode,
        driverTruckNumber: reg.truckNumber,
      }),

      setDriverPaid: (paid) => set({ isDriverPaid: paid }),

      setDriverAreaCode: (code) => set({ driverAreaCode: code }),

      setActiveDelivery: (delivery) => set({ activeDelivery: delivery }),

      updatePreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs },
      })),

      setAppReady: (ready) => set({ isAppReady: ready }),

      reset: () => set(initialState),
    }),
    {
      name: 'ice-cream-man-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist these fields — transient state resets on restart
      partialize: (state) => ({
        userRole: state.userRole,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
        loginMethod: state.loginMethod,
        driverRegistration: state.driverRegistration,
        driverAreaCode: state.driverAreaCode,
        driverTruckNumber: state.driverTruckNumber,
        isDriverRegistered: state.isDriverRegistered,
        isDriverPaid: state.isDriverPaid,
        preferences: state.preferences,
      }),
    }
  )
);

// ─────────────────────────────────────────────
// Selectors (stable references, no new objects)
// ─────────────────────────────────────────────

export const selectUserRole = (s: AppState) => s.userRole;
export const selectIsAuthenticated = (s: AppState) => s.isAuthenticated;
export const selectDriverRegistration = (s: AppState) => s.driverRegistration;
export const selectIsDriverReady = (s: AppState) => s.isDriverRegistered && s.isDriverPaid;
export const selectActiveDelivery = (s: AppState) => s.activeDelivery;
export const selectPreferences = (s: AppState) => s.preferences;
export const selectIsAppReady = (s: AppState) => s.isAppReady;
