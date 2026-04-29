import { create } from 'zustand';
import { authService } from '@/services/auth';
import type { Activity, ProfileResponse } from '@/services/auth';
import { getStoredLanguage, persistLanguage } from '@/lib/language';
import i18n from '@/locales/i18n';
import { useAuthStore } from './authStore';

const DASHBOARD_TTL_MS = 60_000;

interface DashboardState {
  plan: string;
  profileName: string;
  profileRestaurantName: string;
  activityLog: Activity[];
  hasFetched: boolean;
  fetchedAt: number | null;
  status: 'idle' | 'loading' | 'ready' | 'error';
  fetchDashboardData: (force?: boolean) => Promise<void>;
  syncProfileFromUser: () => void;
  updateProfile: (name: string, restaurantName: string, languagePreference: string) => Promise<void>;
}

let dashboardRequest: Promise<void> | null = null;

function shouldApplyProfileLanguage(profile: ProfileResponse): boolean {
  if (!profile.language_preference) return false;
  return !getStoredLanguage();
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  plan: 'Basic',
  profileName: '',
  profileRestaurantName: '',
  activityLog: [],
  hasFetched: false,
  fetchedAt: null,
  status: 'idle',

  fetchDashboardData: async (force = false) => {
    if (dashboardRequest) {
      return dashboardRequest;
    }

    const { hasFetched, fetchedAt, status } = get();
    const isFresh = !force && hasFetched && fetchedAt && Date.now() - fetchedAt < DASHBOARD_TTL_MS;
    if (isFresh || status === 'loading') {
      return;
    }

    set({ status: 'loading' });

    dashboardRequest = (async () => {
      try {
        const [profileRes, activitiesRes] = await Promise.all([
          authService.getProfile(),
          authService.getActivities(20, 0),
        ]);

        if (shouldApplyProfileLanguage(profileRes)) {
          const normalized = persistLanguage(profileRes.language_preference);
          await i18n.changeLanguage(normalized);
        }

        set({
          profileName: profileRes.name || '',
          profileRestaurantName: profileRes.restaurant_name || '',
          activityLog: activitiesRes?.activities || [],
          hasFetched: true,
          fetchedAt: Date.now(),
          status: 'ready',
        });

        useAuthStore.setState((state) => ({
          user: state.user
            ? {
                ...state.user,
                name: profileRes.name || state.user.name,
                restaurant_name: profileRes.restaurant_name || state.user.restaurant_name,
                language_preference: profileRes.language_preference || state.user.language_preference,
              }
            : state.user,
        }));
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        set({ status: 'error' });
      } finally {
        dashboardRequest = null;
      }
    })();

    return dashboardRequest;
  },

  syncProfileFromUser: () => {
    const user = useAuthStore.getState().user;
    if (!user) return;

    set((state) => ({
      profileName: state.profileName || user.name || user.full_name || '',
      profileRestaurantName: state.profileRestaurantName || user.restaurant_name || '',
    }));
  },

  updateProfile: async (name: string, restaurantName: string, languagePreference: string) => {
    await authService.updateProfile(name, restaurantName, languagePreference);

    const normalizedLanguage = persistLanguage(languagePreference);
    await i18n.changeLanguage(normalizedLanguage);

    set({
      profileName: name,
      profileRestaurantName: restaurantName,
      hasFetched: true,
      fetchedAt: Date.now(),
    });

    useAuthStore.setState((state) => ({
      user: state.user
        ? {
            ...state.user,
            name,
            restaurant_name: restaurantName,
            language_preference: normalizedLanguage,
          }
        : state.user,
    }));
  },
}));
