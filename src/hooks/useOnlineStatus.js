import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

// Tracks connectivity so the app can show a banner and disable
// network-dependent actions (analysing a photo, submitting forms) instead
// of letting them fail deep inside a try/catch with a confusing error.
// isInternetReachable can be null right after startup before the first
// real check completes, so we only treat it as offline once it's
// explicitly false — not on that initial null.
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      setIsOnline(online);
    });
    return () => unsubscribe();
  }, []);

  return isOnline;
}
