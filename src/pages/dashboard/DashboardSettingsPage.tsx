import { useEffect, useState, useMemo } from 'react';
import type { FormEvent } from 'react';
import { Globe, Mail, Save, Store, User, Shield, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const initialProfileName = storedProfileName || user?.name || user?.full_name || '';
  const initialRestaurantName = storedProfileRestaurantName || user?.restaurant_name || '';

  useEffect(() => {
    setProfileName(initialProfileName);
  }, [initialProfileName]);

  useEffect(() => {
    setProfileRestaurantName(initialRestaurantName);
  }, [initialRestaurantName]);

  useEffect(() => {
    setLanguagePreference(lang);
  }, [lang]);

  const hasChanges = useMemo(() => {
    return (
      profileName !== initialProfileName ||
      profileRestaurantName !== initialRestaurantName ||
      languagePreference !== lang
    );
  }, [profileName, initialProfileName, profileRestaurantName, initialRestaurantName, languagePreference, lang]);

  const handleUpdateProfile = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    if (!hasChanges) return;
    
    setIsUpdatingProfile(true);
    try {
      await useDashboardStore.getState().updateProfile(profileName, profileRestaurantName, languagePreference);
      if (languagePreference !== lang) {
        setLang(languagePreference);
      }
      showToast(tDash('dash.settings.success'), 'success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : tDash('dash.settings.error');
      showToast(message, 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-24">
      <section className="relative overflow-hidden rounded-[32px] border border-white/8 bg-black/40 p-8 lg:p-10">
        {/* Ambient Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary-500/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[80px]" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md">
              <User className="h-5 w-5" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300/80">{tDash('dash.settings.title')}</p>
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-4xl">{tDash('dash.settings.title')}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
            Keep account identity, restaurant naming, and language preferences in sync across the Dashboard and Studio experience.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <form id="settings-form" onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Identity Card */}
            <div className="rounded-[28px] border border-white/8 bg-white/[0.02] p-1">
              <div className="rounded-[24px] bg-black/40 p-6 lg:p-8 backdrop-blur-xl">
                <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
                  <Store className="h-5 w-5 text-primary-400" />
                  {tDash('dash.settings.identity.title')}
                </h2>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/80">
                      {tDash('dash.settings.name')}
                    </span>
                    <div className={`relative overflow-hidden rounded-xl border transition-colors duration-300 ${focusedField === 'name' ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/10 bg-black/20'}`}>
                      <input
                        value={profileName}
                        onChange={(event) => setProfileName(event.target.value)}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-transparent px-4 py-3.5 text-white outline-none placeholder:text-white/20"
                        placeholder={tDash('dash.settings.identity.namePlaceholder')}
                      />
                    </div>
                  </label>

                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/80">
                      {tDash('dash.settings.restaurant')}
                    </span>
                    <div className={`relative overflow-hidden rounded-xl border transition-colors duration-300 ${focusedField === 'restaurant' ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/10 bg-black/20'}`}>
                      <input
                        value={profileRestaurantName}
                        onChange={(event) => setProfileRestaurantName(event.target.value)}
                        onFocus={() => setFocusedField('restaurant')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full bg-transparent px-4 py-3.5 text-white outline-none placeholder:text-white/20"
                        placeholder={tDash('dash.settings.identity.restaurantPlaceholder')}
                      />
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Account Card */}
            <div className="rounded-[28px] border border-white/8 bg-white/[0.02] p-1">
              <div className="rounded-[24px] bg-black/40 p-6 lg:p-8 backdrop-blur-xl">
                <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
                  <Shield className="h-5 w-5 text-blue-400" />
                  {tDash('dash.settings.security.title')}
                </h2>
                
                <div className="grid gap-6">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/80">
                      {tDash('dash.settings.email')}
                    </span>
                    <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/5">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-4 opacity-50">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        value={user?.email || ''}
                        readOnly
                        className="w-full bg-transparent py-3.5 pl-10 pr-4 text-white/50 outline-none cursor-not-allowed"
                      />
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-white/40 mt-2">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {tDash('dash.settings.security.emailHint')}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Preferences Card */}
            <div className="rounded-[28px] border border-white/8 bg-white/[0.02] p-1">
              <div className="rounded-[24px] bg-black/40 p-6 lg:p-8 backdrop-blur-xl">
                <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-white">
                  <Globe className="h-5 w-5 text-emerald-400" />
                  {tDash('dash.settings.preferences.title')}
                </h2>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white/80">
                      {tDash('dash.settings.lang')}
                    </span>
                    <div className={`relative overflow-hidden rounded-xl border transition-colors duration-300 ${focusedField === 'lang' ? 'border-primary-500/50 bg-primary-500/5' : 'border-white/10 bg-black/20'}`}>
                      <select
                        value={languagePreference}
                        onChange={(event) => setLanguagePreference(event.target.value)}
                        onFocus={() => setFocusedField('lang')}
                        onBlur={() => setFocusedField(null)}
                        className="w-full appearance-none bg-transparent px-4 py-3.5 text-white outline-none"
                      >
                        <option value="en" className="bg-gray-900">English</option>
                        <option value="zh" className="bg-gray-900">中文</option>
                        <option value="th" className="bg-gray-900">ไทย</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
                        <svg className="h-4 w-4 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </form>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/8 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Sparkles className="h-24 w-24 text-primary-300" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300/70">{tDash('dash.settings.plan')}</p>
            <h2 className="mt-3 text-3xl font-black text-white">{plan || tDash('dash.settings.free')}</h2>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-semibold text-emerald-400">{tDash('dash.settings.plan.activeStatus')}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Plan entitlements, wallet balance, and access rights stay owned by global stores, not page-local state.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-black/20 p-6 backdrop-blur-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-gray-500">Language Sync</p>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              Language preference is synchronized across top navigation, Account Settings, and dashboard bootstrap without forcing a route-level reset to English.
            </p>
          </div>
        </aside>
      </div>

      {/* Floating Save Action Bar (Defensive Design / Spatial Continuity) */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
            className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-black/80 px-6 py-4 shadow-2xl backdrop-blur-xl"
          >
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">{tDash('dash.settings.saveBar.title')}</p>
              <p className="text-xs text-white/50">{tDash('dash.settings.saveBar.desc')}</p>
            </div>
            <div className="flex items-center gap-3 ml-2">
              <button
                type="button"
                onClick={() => {
                  setProfileName(initialProfileName);
                  setProfileRestaurantName(initialRestaurantName);
                  setLanguagePreference(lang);
                }}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                {tDash('dash.settings.saveBar.discard')}
              </button>
              <button
                form="settings-form"
                type="submit"
                disabled={isUpdatingProfile}
                className="group relative overflow-hidden rounded-full bg-primary-500 px-6 py-2 text-sm font-bold text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all hover:bg-primary-400 hover:shadow-[0_0_30px_rgba(139,92,246,0.6)] disabled:opacity-60"
              >
                <div className="absolute inset-0 flex items-center justify-center bg-white/20 opacity-0 transition-opacity group-active:opacity-100" />
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isUpdatingProfile ? tDash('dash.settings.saveBar.saving') : tDash('dash.settings.saveBar.save')}
                </span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
