import { ENV } from '../../config/env';
import {
  AUTH_URL,
  withExpiry,
  saveSession,
  clearSession,
  loadStoredSession,
  ensureFreshSession,
  notify,
  addAuthListener,
} from './session';

export const auth = {
  async signInWithPassword({ email, password }) {
    try {
      const res = await fetch(`${AUTH_URL}/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: ENV.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = withExpiry(await res.json());
      if (!res.ok) {
        return { data: null, error: { message: json.error_description || json.msg || 'Login failed' } };
      }
      await saveSession(json);
      notify('SIGNED_IN', json);
      return { data: { user: json.user, session: json }, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  },

  async getSession() {
    await loadStoredSession();
    await ensureFreshSession();
    // ensureFreshSession mutates the module-level session in place via
    // saveSession/clearSession, so re-read it after the check.
    const session = await loadStoredSession();
    return { data: { session } };
  },

  onAuthStateChange(cb) {
    const unsubscribe = addAuthListener(cb);
    return { data: { subscription: { unsubscribe } } };
  },

  async signOut() {
    await clearSession();
    notify('SIGNED_OUT', null);
    return { error: null };
  },

  async signUp({ email, password }) {
    try {
      const res = await fetch(`${AUTH_URL}/signup`, {
        method: 'POST',
        headers: { apikey: ENV.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = withExpiry(await res.json());
      if (!res.ok) {
        return {
          data: null,
          error: { message: json.error_description || json.msg || json.error || 'Sign up failed' },
        };
      }
      if (json.access_token) {
        await saveSession(json);
        notify('SIGNED_IN', json);
        return { data: { user: json.user, session: json, needsConfirmation: false }, error: null };
      }
      return { data: { user: json.user || json, session: null, needsConfirmation: true }, error: null };
    } catch (e) {
      return { data: null, error: { message: e.message } };
    }
  },

  async resetPasswordForEmail(email) {
    try {
      const res = await fetch(`${AUTH_URL}/recover`, {
        method: 'POST',
        headers: { apikey: ENV.SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        return { error: { message: json.error_description || json.msg || 'Could not send reset email' } };
      }
      return { error: null };
    } catch (e) {
      return { error: { message: e.message } };
    }
  },
};
