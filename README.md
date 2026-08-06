# AgriSmart Kenya

React Native (Expo) + Supabase mobile app for crop disease diagnosis, market
prices, and weather advisories for smallholder farmers in Kenya. Built as a
bilingual (English/Swahili), mobile-first tool for farmers who are often on
mid-range or older phones and unreliable rural connections, not just a demo
for ideal conditions.

## Features

- **AI-assisted crop disease diagnosis.** A farmer photographs or picks a
  leaf photo, selects the crop, and the photo is sent to Google's Gemini
  vision model (`src/lib/geminiVision.js`) with a prompt written specifically
  for smallholder Kenyan farming. The response is parsed into a disease name,
  scientific name, confidence score, plain-language explanation, and a
  numbered treatment plan (`src/lib/geminiParse.js`).
- **Photo optimisation for low-end phones and slow connections.** Before a
  photo goes anywhere, `src/lib/imageUtils.js` resizes it to a 1024px long
  edge and re-encodes it as 70%-quality JPEG. Raw camera output on a modern
  phone can be several megabytes; on a rural or metered connection that turns
  a single diagnosis into a multi-minute wait or a failed upload. This step
  keeps both the Gemini call and the Storage upload small and fast, with no
  visible loss of detail for disease identification, and shows a
  "Processing photo…" state so the app doesn't feel frozen while it works.
  This is a standardisation/compression step, not photo enhancement, it
  won't sharpen a badly blurred or badly lit photo, only make whatever photo
  is taken quick and reliable to send.
- **Disease matching against a structured table.** Gemini returns free text,
  which on its own can't be reliably queried or joined. `src/lib/diseaseMatch.js`
  fuzzy-matches that text against the app's own `diseases` table so a
  diagnosis links to a real `disease_id` where possible, while still keeping
  Gemini's raw text in `ai_disease_name` if no match is found.
- **A real "this isn't a plant" path.** If the photo clearly isn't a leaf,
  the app skips the Storage upload and history save entirely (nothing useful
  to store) and sends the farmer straight to a Retake Photo screen instead of
  a dead end or a nonsensical diagnosis.
- **Diagnosis history.** Every completed diagnosis is saved per-user and
  shown on the Home screen, with a status of pending, treated, or action
  needed.
- **Weather advisories**, shown on Home for the farmer's saved county. If
  nothing is scheduled for today or later, it falls back to the most recent
  past advisory instead of showing nothing.
- **Market prices**, filterable by crop, showing variety, market/county,
  price per kg (formatted with thousands separators via
  `src/utils/formatPrice.js`), and a trend indicator.
- **A "Talk to an Expert" directory** (`src/data/expertContacts.js`) with
  real Kenyan agricultural support lines (KALRO, the toll-free Agro-Advisory
  Call Centre), one tap away from the diagnosis result via the phone's
  native dialer.
- **A USSD-access explainer screen.** For farmers without a smartphone, the
  app describes the `*384#` flow that would carry the same core services
  over any basic phone. This screen is currently informational only inside
  the smartphone app, it is not yet a live USSD session through a telco
  gateway. See "Known limitations" below.
- **Full bilingual English/Swahili interface**, switchable from a toggle on
  every screen, backed by `src/i18n/translations.js`.
- **Offline detection.** A banner shows across the whole app when the device
  has no connection, and the Analyse Crop button disables itself, rather
  than letting the farmer tap it and hit a confusing failure deep inside a
  network call.
- **Account security via Supabase Auth + Row Level Security.** Every farmer
  signs in with email/password; Postgres Row Level Security on the
  user-scoped tables (`profiles`, `diagnoses`) ensures one farmer can never
  read or write another farmer's rows.
- **Camera + gallery permission handling**, with clear bilingual prompts if
  camera or photo library access is denied (see `app.json` for the iOS
  usage-description strings and Android permissions).

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
    ├── hooks/
    │   └── useOnlineStatus.js    # Detects connectivity loss for offline UI
    ├── lib/
    │   ├── geminiVision.js       # Gemini vision API call for disease ID
    │   ├── geminiParse.js        # Parses/cleans Gemini's JSON response
    │   ├── diseaseMatch.js       # Fuzzy-matches AI text to a diseases.id
    │   ├── imageUtils.js         # Resize/compress photos before upload
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
    │   ├── DiagThumb.js
    │   ├── ErrorBanner.js
    │   ├── ErrorBoundary.js
    │   └── OfflineBanner.js
    ├── utils/
    │   ├── status.js              # statusLabel / statusStyle helpers
    │   ├── formatPrice.js         # Thousands-separator price formatting
    │   └── validateCredentials.js # Client-side sign-in/sign-up validation
    ├── styles/
    │   └── styles.js              # All StyleSheet definitions
    ├── __tests__/                  # Jest unit tests (pure logic only)
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
  previously visible in plain text in an earlier Expo Snack prototype.
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
- **Home screen weather now falls back gracefully**: if no advisory is
  dated in the future for the farmer's county, it shows the most recent
  past advisory instead of "No advisory for today"
  (`src/screens/HomeScreen.js`).
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

## Known limitations

Recorded here on purpose, rather than left implicit:

- **Weather and market data are curated, not live.** `weather_advisories`
  and `market_prices` are populated directly in Supabase rather than pulled
  from a live external feed (e.g. Open-Meteo, KACE). The schema is already
  shaped to receive that data the moment a scheduled ingestion job exists.
- **The USSD screen is a concept, not a live gateway.** It explains the
  `*384#` flow but doesn't yet run a real session through a telco provider
  like Africa's Talking.
- **No offline inference.** Disease diagnosis requires connectivity, since
  it calls the Gemini API rather than running a model on-device. The
  offline banner exists to make this limitation visible, not to work
  around it.
- **Accessibility gaps**: the red/green diagnosis status convention
  currently relies on colour alone, not every touchable element has a
  screen-reader label yet, and the layout hasn't been tested at tablet
  width or under increased system font scaling.
