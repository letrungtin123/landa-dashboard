import { useEffect } from 'react';
import { useAuthStore } from '@/utils/store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setLoading, isAuthenticated, tokenExpiresAt, scheduleTokenRefresh } = useAuthStore();

  useEffect(() => {
    // Rehydrate: state đã được restore từ encrypted storage
    // Chỉ cần set loading = false để unlock UI
    setLoading(false);

    // Nếu đã auth + token còn hiệu lực → schedule refresh
    if (isAuthenticated && tokenExpiresAt && Date.now() < tokenExpiresAt) {
      scheduleTokenRefresh();
    }
  }, [setLoading, isAuthenticated, tokenExpiresAt, scheduleTokenRefresh]);

  return <>{children}</>;
}
