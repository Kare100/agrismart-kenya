// Central place that reads secrets out of .env (via react-native-dotenv,
// configured in babel.config.js). Nothing else in the app should import
// "@env" directly — import from here instead, so there's exactly one
// place to change if the loading strategy ever changes.
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  GEMINI_API_KEY,
  GEMINI_MODEL,
} from '@env';

export const ENV = {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  GEMINI_API_KEY,
  GEMINI_MODEL: GEMINI_MODEL || 'gemini-3.1-flash-lite',
};

if (__DEV__) {
  const missing = Object.entries(ENV)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length) {
    console.warn(
      `[env] Missing values for: ${missing.join(', ')}. ` +
        'Did you create a .env file from .env.example?'
    );
  }
}
