'use client';

import { useAuth } from '../hooks/useAuth';
import { CareAlertProvider } from '../contexts/CareAlertContext';
import CareAlertNotification from './CareAlertNotification';

/**
 * Global care alert wrapper that only activates when user is authenticated.
 * This should be placed in the root layout to persist across page navigations.
 */
export default function GlobalCareAlert({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  // Only enable care alerts for authenticated users
  const shouldEnableAlerts = isAuthenticated && !isLoading;

  return (
    <CareAlertProvider enabled={shouldEnableAlerts}>
      {children}
      {shouldEnableAlerts && <CareAlertNotification />}
    </CareAlertProvider>
  );
}
