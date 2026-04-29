import { Suspense, lazy } from 'react';
import type { ReactNode } from 'react';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Toast from '@/components/Toast';

const MainLayout = lazy(() => import('@/layouts/MainLayout'));
const DashboardLayout = lazy(() => import('@/layouts/DashboardLayout'));
const LandingPage = lazy(() => import('@/pages/Landing'));
const LoginPage = lazy(() => import('@/pages/Login'));
const RegisterPage = lazy(() => import('@/pages/Register'));
const StudioPage = lazy(() => import('@/pages/Studio'));
const SharePostPage = lazy(() => import('@/pages/SharePost'));
const PrivacyPage = lazy(() => import('@/pages/Privacy'));
const TermsPage = lazy(() => import('@/pages/Terms'));
const DashboardHomePage = lazy(() => import('@/pages/dashboard/DashboardHomePage'));
const DashboardCreatePage = lazy(() => import('@/pages/dashboard/DashboardCreatePage'));
const DashboardTemplateCenterPage = lazy(() => import('@/pages/dashboard/DashboardTemplateCenterPage'));
const AssetLibrarySection = lazy(() => import('@/pages/dashboard/AssetLibrarySection'));
const HistoryCenter = lazy(() => import('@/pages/dashboard/HistoryCenter'));
const DashboardWalletPage = lazy(() => import('@/pages/dashboard/DashboardWalletPage'));
const DashboardReferralPage = lazy(() => import('@/pages/dashboard/DashboardReferralPage'));
const DashboardSettingsPage = lazy(() => import('@/pages/dashboard/DashboardSettingsPage'));
const ChannelLayout = lazy(() => import('@/pages/dashboard/channel/ChannelLayout'));
const ChannelOverviewPage = lazy(() => import('@/pages/dashboard/channel/ChannelOverviewPage'));
const ChannelCommissionsPage = lazy(() => import('@/pages/dashboard/channel/ChannelCommissionsPage'));
const ChannelSettlementsPage = lazy(() => import('@/pages/dashboard/channel/ChannelSettlementsPage'));
const ChannelCurrentBindingPage = lazy(() => import('@/pages/dashboard/channel/ChannelCurrentBindingPage'));
const ChannelPreviewPage = lazy(() => import('@/pages/dashboard/channel/ChannelPreviewPage'));
const ChannelAdjustmentsPage = lazy(() => import('@/pages/dashboard/channel/ChannelAdjustmentsPage'));

const AppRoot = () => (
  <>
    <Toast />
    <Outlet />
  </>
);

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#060608] px-6">
      <div className="glass-strong animate-slide-up w-full max-w-md rounded-[28px] border border-white/10 px-6 py-10 text-center shadow-[0_0_40px_rgba(249,115,22,0.12)] backdrop-blur-2xl">
        <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-orange-500/30 via-orange-400/15 to-purple-500/25 blur-[1px]" />
        <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.28em] text-orange-200/70">Loading</p>
        <p className="mt-2 text-sm text-white/65">Preparing the workspace...</p>
      </div>
    </div>
  );
}

function withSuspense(node: ReactNode) {
  return <Suspense fallback={<RouteLoader />}>{node}</Suspense>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppRoot />,
    children: [
      {
        element: withSuspense(<MainLayout />),
        children: [
          {
            index: true,
            element: withSuspense(<LandingPage />),
          },
          {
            path: 'privacy',
            element: withSuspense(<PrivacyPage />),
          },
          {
            path: 'terms',
            element: withSuspense(<TermsPage />),
          },
          {
            path: 'templates',
            element: withSuspense(<DashboardTemplateCenterPage />),
          },
          {
            path: 'templates/:templateId',
            element: withSuspense(<DashboardTemplateCenterPage />),
          },
        ],
      },
      {
        path: 'studio',
        element: withSuspense(<StudioPage />),
      },
      {
        path: 'share/:token',
        element: withSuspense(<SharePostPage />),
      },
      {
        path: 'login',
        element: withSuspense(<LoginPage />),
      },
      {
        path: 'register',
        element: withSuspense(<RegisterPage />),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            {withSuspense(<DashboardLayout />)}
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: withSuspense(<DashboardHomePage />),
          },
          {
            path: 'create',
            element: withSuspense(<DashboardCreatePage />),
          },
          {
            path: 'templates',
            element: withSuspense(<DashboardTemplateCenterPage />),
          },
          {
            path: 'library',
            element: withSuspense(<AssetLibrarySection />),
          },
          {
            path: 'history',
            element: withSuspense(<HistoryCenter />),
          },
          {
            path: 'wallet',
            element: withSuspense(<DashboardWalletPage />),
          },
          {
            path: 'referral',
            element: withSuspense(<DashboardReferralPage />),
          },
          {
            path: 'settings',
            element: withSuspense(<DashboardSettingsPage />),
          },
          {
            path: 'channel',
            element: withSuspense(<ChannelLayout />),
            children: [
              {
                index: true,
                element: withSuspense(<ChannelOverviewPage />),
              },
              {
                path: 'commissions',
                element: withSuspense(<ChannelCommissionsPage />),
              },
              {
                path: 'settlements',
                element: withSuspense(<ChannelSettlementsPage />),
              },
              {
                path: 'current-binding',
                element: withSuspense(<ChannelCurrentBindingPage />),
              },
              {
                path: 'preview',
                element: withSuspense(<ChannelPreviewPage />),
              },
              {
                path: 'adjustments',
                element: withSuspense(<ChannelAdjustmentsPage />),
              },
            ],
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
