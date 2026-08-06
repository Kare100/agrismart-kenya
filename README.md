# AgriSmart Kenya

React Native (Expo) + Supabase mobile app for crop disease diagnosis, market
prices, and weather advisories for smallholder farmers in Kenya.

## Project structure

```
agrismart-kenya/
├── App.js                      # Navigation + tab bar only
├── app.json                    # Expo config (camera/photo permissions)
├── babel.config.js             # Loads .env via react-native-dotenv
├── .env.example                # Copy to .env and fill in real values
├── package.json
└── src/
    ├── config/
    │   └── env.js               # Reads secrets from .env, warns if missing
    ├── theme/
    │   └── colors.js             # Color tokens (C.green, C.amber, ...)
    ├── i18n/
    │   └── translations.js       # EN / SW strings (T.EN / T.SW)
    ├── data/
    │   └── expertContacts.js     # Expert call-centre directory + dialer
    ├── lib/
    │   ├── geminiVision.js       # Gemini vision API call for disease ID
    │   └── supabase/
    │       ├── session.js        # Session storage + token auto-refresh
    │       ├── query.js          # Chainable PostgREST query builder
    │       ├── storage.js        # Photo upload to the plant-photos bucket
    │       ├── auth.js           # signIn / signUp / signOut / resetPassword
    │       └── index.js          # Exports `supabase` (mirrors supabase-js)
    ├── components/
    │   ├── Card.js
    │   ├── LangToggle.js
    │   ├── Spinner.js
    │   └── DiagThumb.js
    ├── utils/
    │   └── status.js             # statusLabel / statusStyle helpers
    ├── styles/
    │   └── styles.js              # All StyleSheet definitions
    └── screens/
        ├── LoginScreen.js
        ├── HomeScreen.js
        ├── DiagnoseScreen.js
        ├── ResultsScreen.js
        ├── PricesScreen.js
        └── USSDScreen.js
```

## Why a custom Supabase client instead of `@supabase/supabase-js`?

The real `supabase-js` package pulls in a Realtime module that depends on
Node's `ws` package, which Metro (Expo's bundler) can't resolve — it crashes
the app. `src/lib/supabase/` re-implements just the pieces this app uses
(PostgREST queries, GoTrue auth, Storage uploads) as plain `fetch` calls,
with the same `.from()` / `.auth` call shape you'd get from the real client.
`channel()` / `removeChannel()` are harmless no-op stubs kept only so
existing call sites don't break — there's no live Realtime subscription.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env template and fill in your real keys:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Supabase URL/anon key and Gemini API key.
   `.env` is git-ignored — it will never get committed.
3. Start the dev server:
   ```bash
   npx expo start
   ```
   Scan the QR code with Expo Go, or press `a`/`i` for an emulator.

## A couple of things worth knowing about the code as-is

- **Secrets**: the anon Supabase key is meant to be public (Row Level
  Security protects your data), but the **Gemini API key is a real secret**.
  It now loads from `.env` instead of being hardcoded — make sure `.env`
  is never committed, and consider rotating that key since it was
  previously visible in plain text in the Snack file.
- Your outstanding Supabase setup tasks (Storage MIME policy for TC-04,
  `name_en`/`name_sw` columns for TC-10, the `experts` table for TC-11,
  a second auth user for TC-07, Realtime on `market_prices` for TC-08)
  are unrelated to this refactor and still need doing separately.
- One leftover debug line (`Alert.alert('Upload debug', ...)`, marked
  `// TEMPORARY` in the original) was removed from the photo-upload error
  handler — it would have shown raw error text to real users.

## Reliability/UX fixes made on top of the reorganization

- **Session refresh no longer signs users out on a network blip** — only
  a genuine 400/401 from the auth server clears the session
  (`src/lib/supabase/session.js`).
- **`disease_id` is now populated** via a fuzzy match against the
  `diseases` table (`src/lib/diseaseMatch.js`), instead of always being
  `null`. If no match is found it stays `null` — the AI's raw text is
  still saved in `ai_disease_name` either way.
- **Photos are compressed** to a 1024px long edge / 70% JPEG quality
  before being sent to Gemini or Storage (`src/lib/imageUtils.js`), with
  a "Processing photo…" state so the UI doesn't feel frozen on slow
  devices.
- **An ErrorBoundary wraps the whole app** (`src/components/ErrorBoundary.js`)
  so an unexpected render error shows a recoverable screen instead of a
  blank white app.
- **Consistent error handling**: recoverable errors (failed loads, failed
  saves) now show as a dismissible inline banner
  (`src/components/ErrorBanner.js`) instead of a mix of `Alert.alert` and
  ad-hoc inline text. `Alert.alert` is now reserved for things that need
  an explicit acknowledgment (camera/gallery permission prompts, "check
  your email" confirmations).
- **"Not a plant photo" now leads to a Retake Photo button** on the
  Results screen instead of a dead end — and that case skips the Storage
  upload and history insert entirely, since there's nothing useful to
  save.
- **Offline detection**: a banner (`src/components/OfflineBanner.js`,
  `src/hooks/useOnlineStatus.js`) shows across the whole app when there's
  no connection, and the "Analyse Crop" button disables itself rather
  than failing deep inside a fetch call.
- **Pull-to-refresh** added on Home and Market Prices.
- **Sign-in/sign-up form validation** (`src/utils/validateCredentials.js`)
  catches empty fields, malformed emails, and short passwords before
  hitting the network.
- **Market prices now format with thousands separators**
  (`src/utils/formatPrice.js`) — `KES 4,500/kg` instead of `KES 4500/kg`.
- **Unit tests** (`src/__tests__/`) cover the pieces of pure logic that
  don't need a device or a live Supabase connection: the disease-name
  matcher, the Gemini JSON parser, price formatting, and credential
  validation. Run them with:
  ```bash
  npm install
  npm test
  ```
  These deliberately don't cover the Supabase REST client itself or any
  screen components — testing those would need React Native's Jest
  preset plus mocks for AsyncStorage/fetch, which is more test
  infrastructure than was worth adding in this pass. Your existing
  Node-based integration test suite at `agrismart-tests/` remains the
  right place to verify the actual Supabase behavior end-to-end.
