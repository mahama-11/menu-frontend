import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import LandingPage from '@/pages/Landing';
import LoginPage from '@/pages/Login';
import RegisterPage from '@/pages/Register';
import DashboardPage from '@/pages/Dashboard';
import DemoPage from '@/pages/Demo';
import PrivacyPage from '@/pages/Privacy';
import TermsPage from '@/pages/Terms';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Toast from '@/components/Toast';

const AppRoot = () => (
  <>
    <Toast />
    <Outlet />
  </>
);

// eslint-disable-next-line react-refresh/only-export-components
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppRoot />,
    children: [
      {
        element: <MainLayout />,
        children: [
          {
            index: true,
            element: <LandingPage />,
          },
          {
            path: 'demo',
            element: <DemoPage />,
          },
          {
            path: 'privacy',
            element: <PrivacyPage />,
          },
          {
            path: 'terms',
            element: <TermsPage />,
          },
        ],
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
