import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV } from '../../config/env';

export const AUTH_URL = `${ENV.SUPABASE_URL}/auth/v1`;

let _session = null;
export let authListeners = [];

export const withExpiry = (json) => {
  if (json && json.expires_in && !json.expires_at) {
    json.expires_at = Math.floor(Date.now() / 1000) + json.expires_in;
  }
  return json;
};

export const getSessionSync = () => _session;

export const saveSession = async (json) => {
  _session = json;
  await AsyncStorage.setItem('sb-session', JSON.stringify(json));
};

export const clearSession = async () => {
  _session = null;
  await AsyncStorage.removeItem('sb-session');
};

export const loadStoredSession = async () => {
  if (!_session) {
    const raw = await AsyncStorage.getItem('sb-session');
    if (raw) _session = JSON.parse(raw);
  }
  return _session;
};

export const notify = (event, session) => {
  authListeners.forEach((cb) => cb(event, session));
};

export const addAuthListener = (cb) => {
  authListeners.push(cb);
  return () => {
    authListeners = authListeners.filter((f) => f !== cb);
  };
};

// Refreshes the access token if it's within 30s of expiring (or already
// expired). Called before every REST/Storage request.
export async function ensureFreshSession() {
  if (!_session?.refresh_token) return;
  const expiresAt = _session.expires_at;
  if (expiresAt && Date.now() / 1000 < expiresAt - 30) return;

  let res;
  try {
    res = await fetch(`${AUTH_URL}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: ENV.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: _session.refresh_token }),
    });
  } catch (networkError) {
    // No connectivity, DNS hiccup, request timeout, etc. The refresh token
    // itself is still fine — don't sign the user out just because the
    // network blipped. The next call to ensureFreshSession will retry.
    console.warn('Session refresh skipped (network error):', networkError.message);
    return;
  }

  // Only a genuine rejection from the auth server (expired/invalid/revoked
  // refresh token) should sign the user out. Anything else (5xx, malformed
  // body) is treated as transient and retried on the next call.
  if (res.ok) {
    const json = withExpiry(await res.json());
    await saveSession(json);
    notify('TOKEN_REFRESHED', json);
    return;
  }

  if (res.status === 400 || res.status === 401) {
    await clearSession();
    notify('SIGNED_OUT', null);
    return;
  }

  console.warn(`Session refresh failed with transient status ${res.status}; will retry later.`);
}

export const restHeaders = (extra = {}) => ({
  apikey: ENV.SUPABASE_ANON_KEY,
  Authorization: `Bearer ${getSessionSync()?.access_token || ENV.SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  ...extra,
});
