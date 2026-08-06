// Lightweight Supabase REST client.
//
// We do NOT use @supabase/supabase-js: its Realtime module pulls in a
// Node-only "ws" package that Expo/Metro's bundler can't resolve, which
// crashes the app. This talks to the same Supabase project via plain
// fetch (PostgREST + GoTrue Auth + Storage), and auto-refreshes the
// token before it expires. `channel()`/`removeChannel()` are no-op stubs
// kept only so existing call sites don't break — there is no live
// Realtime subscription here.
import { Query } from './query';
import { auth } from './auth';

export { uploadPhotoToStorage } from './storage';

export const supabase = {
  from(table) {
    return new Query(table);
  },
  auth,
  channel() {
    return {
      on() {
        return this;
      },
      subscribe() {
        return this;
      },
    };
  },
  removeChannel() {},
};
