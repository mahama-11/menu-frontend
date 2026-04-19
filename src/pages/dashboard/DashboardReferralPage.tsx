import { Navigate, useOutletContext } from 'react-router-dom';
import ReferralCenter from './ReferralCenter';

export default function DashboardReferralPage() {
  const { hasReferralAccess, canManageReferral } = useOutletContext<{ hasReferralAccess: boolean; canManageReferral: boolean }>();

  if (!hasReferralAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <ReferralCenter canManageReferral={canManageReferral} />;
}
