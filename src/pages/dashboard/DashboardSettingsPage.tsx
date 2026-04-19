import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Globe, Mail, Save, Store } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useDashboardStore } from '@/store/dashboardStore';
import { useToastStore } from '@/store/toastStore';
import { useI18n } from '@/hooks/useI18n';
import { getDashboardText } from './copy';

export default function DashboardSettingsPage() {
  const { lang, setLang } = useI18n();
  const user = useAuthStore((state) => state.user);
  const plan = useDashboardStore((state) => state.plan);
  const storedProfileName = useDashboardStore((state) => state.profileName);
  const storedProfileRestaurantName = useDashboardStore((state) => state.profileRestaurantName);
  const showToast = useToastStore((state) => state.showToast);
  const tDash = (key: string) => getDashboardText(lang, key);

  const [profileName, setProfileName] = useState('');
  const [profileRestaurantName, setProfileRestaurantName] = useState('');
  const [languagePreference, setLanguagePreference] = useState(lang);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    setProfileName(storedProfileName || user?.name || user?.full_name || '');
  }, [storedProfileName, user]);

  useEffect(() => {
    setProfileRestaurantName(storedProfileRestaurantName || user?.restaurant_name || '');
  }, [storedProfileRestaurantName, user]);

  useEffect(() => {
    setLanguagePreference(lang);
  }, [lang]);

  const handleUpdateProfile = async (event: FormEvent) => {
    event.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await useDashboardStore.getState().updateProfile(profileName, profileRestaurantName, languagePreference);
      showToast(`${tDash('dash.settings.save')} Success`, 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      showToast(message, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguagePreference(value);
    setLang(value);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <section className="rounded-[28px] border border-white/8 bg-white/[0.035] p-6 lg:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300/70">{tDash('dash.settings.title')}</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">{tDash('dash.settings.title')}</h1>
        <p className="mt-3 text-sm leading-7 text-white/55 sm:text-base">
          Keep account identity, restaurant naming, and language preferences in sync across the Dashboard and Studio experience.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={handleUpdateProfile} className="rounded-[28px] border border-white/8 bg-white/[0.035] p-6">
          <div className="grid gap-5">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <Store className="h-4 w-4 text-primary-300" />
                {tDash('dash.settings.name')}
              </span>
              <input
                value={profileName}
                onChange={(event) => setProfileName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-primary-500/30"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <Store className="h-4 w-4 text-primary-300" />
                {tDash('dash.settings.restaurant')}
              </span>
              <input
                value={profileRestaurantName}
                onChange={(event) => setProfileRestaurantName(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-primary-500/30"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <Mail className="h-4 w-4 text-primary-300" />
                {tDash('dash.settings.email')}
              </span>
              <input
                value={user?.email || ''}
                readOnly
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-gray-400 outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                <Globe className="h-4 w-4 text-primary-300" />
                {tDash('dash.settings.lang')}
              </span>
              <select
                value={languagePreference}
                onChange={(event) => handleLanguageChange(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition focus:border-primary-500/30"
              >
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="th">ไทย</option>
              </select>
            </label>

            <button type="submit" disabled={isUpdatingProfile} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-5 py-3 font-bold text-white transition hover:bg-primary-400 disabled:cursor-not-allowed disabled:opacity-60">
              <Save className="h-4 w-4" />
              {isUpdatingProfile ? 'Saving...' : tDash('dash.settings.save')}
            </button>
          </div>
        </form>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/8 bg-white/[0.035] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">{tDash('dash.settings.plan')}</p>
            <h2 className="mt-3 text-2xl font-black text-white">{plan || tDash('dash.settings.free')}</h2>
            <p className="mt-2 text-sm text-white/50">Plan entitlements, wallet balance, and access rights stay owned by global stores, not page-local state.</p>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-white/[0.035] p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Language Sync</p>
            <p className="mt-3 text-sm text-white/55">
              Language preference is now synchronized across top navigation, Account Settings, and dashboard bootstrap without forcing a route-level reset to English.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
