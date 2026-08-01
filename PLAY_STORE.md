# Imara Afya — Google Play release checklist

Android only for now. iOS config exists in `app.json` but is not being pursued.

---

## 0. Account: PERSONAL (decided)

Registering a personal developer account. No D-U-N-S needed — that is only
required for an organisation account. **$25, one time**, plus government photo
ID and a card that works for the payment.

The consequence: personal accounts created after 13 November 2023 **cannot
publish to production** until they run a closed test with **12 opted-in testers
for 14 continuous days**.

What "opted in" means in practice:

- The tester accepted the invite **and installed the app** under the same Google
  account that was invited. An invite that was never installed does not count.
- All 12 must overlap in one continuous 14-day window. If someone uninstalls or
  drops out on day 7, the counter resets.
- Real devices and real Google accounts only. Emulators and duplicate accounts
  are detected and do not count.

**Start recruiting the 12 before the app is finished.** Fourteen days is the
floor, not the estimate — the clock only starts once all 12 have installed, so
a slow week of recruiting is a slow week added to launch.

This window is also the best possible use of the time: real people, real
handsets, real Burundian networks, for two weeks, while the remaining features
are finished.

---

## 1. Blockers — the build will not work without these

| # | What | Where |
| --- | --- | --- |
| 1 | Production API URL | `eas.json` → `build.production.env.EXPO_PUBLIC_GRAPHQL_URL` — currently a placeholder. The app points at nothing until this is a real HTTPS URL. |
| 2 | Google Maps API key | `app.json` → `android.config.googleMaps.apiKey` — currently `""`, so the map renders grey. Enable **Maps SDK for Android**, restrict the key to `bi.imaraco.imaraafya` + your release SHA-1. |
| 3 | Hospital data | `imara-afya-backend/data/hospitals.json` — Find care shows its empty state until this is filled with verified facilities. |

Backend must be deployed over **HTTPS** first. Android blocks plaintext HTTP by
default, so an `http://` API will fail silently in a release build even though it
works in development.

---

## 2. Blockers — Play will reject without these

### Privacy policy (hard requirement)

A publicly hosted URL, linked in the Play listing **and** reachable from inside
the app. Required because the app collects:

- Account: name, email, password
- Profile: photo, height, weight, gender, religion
- Health: conditions, allergies, medicines, dose history, water/sleep/weight
- **Reproductive health: menstrual cycles and pregnancy**
- Location: coarse/fine, only while using Find care

Reproductive health is treated as sensitive by Google. The policy must say
plainly what is collected, why, where it is stored, how long it is kept, and how
a user deletes their account and data.

**This is a legal document. Have someone qualified review it — I can draft a
starting point but a draft is not legal advice.**

### Data Safety form

Declare every item above. Two answers people get wrong and later get pulled for:

- **Is data encrypted in transit?** Yes — but only once the backend is HTTPS.
- **Can users request deletion?** There is currently **no delete-account
  feature**. Either build one or answer honestly that deletion is by request via
  a support email you actually monitor.

### Account deletion

Play requires that an app offering account creation also offers deletion — both
in-app and via a web URL. **Not built yet.** This is the most likely rejection
after the privacy policy.

### Health app declaration

The listing will be reviewed as a health app. Do not describe it as diagnosing,
treating or preventing illness. The app tracks and reminds; it is not a medical
device and should not be described as one.

---

## 3. Listing assets

- App icon 512×512 (have `assets/images/icon.png` — check it exports cleanly)
- Feature graphic 1024×500 — **not created yet**
- Phone screenshots: 2–8, minimum 320px on the short side
- Short description (80 chars) and full description (4000)
- Content rating questionnaire
- Contact email + support URL

Write the listing in **French and Kirundi as well as English** — matching the
languages in the app, and the languages your users actually read.

---

## 4. Build and ship

```bash
npm install -g eas-cli
eas login
eas build:configure

# internal test APK first — install on a real Burundian handset
eas build --platform android --profile preview

# release bundle for Play
eas build --platform android --profile production
eas submit --platform android
```

Ship through **internal testing → closed testing → production**, not straight to
production. A health app that mis-fires a reminder or lists a wrong hospital is
worse than one that launches a month later.

---

## 5. Known gaps at first release

Decide deliberately whether each ships or waits:

- **Medication reminders do not fire.** `expo-notifications` is installed but no
  scheduling logic exists. The app displays reminder times it never delivers.
  For an app whose main promise is reminders, this is the biggest gap.
- **Password reset does not deliver.** The flow is complete except email sending
  — see `imara-afya-backend/src/services/mailService.ts`. A user who forgets
  their password is locked out permanently.
- **No account deletion** (see above — Play requires it).
- **No error monitoring.** When the app crashes in Bujumbura at 2am, nothing
  tells you. Sentry's free tier is about ten minutes of work.
- **No offline support.** The PRD calls for offline-first; today every screen
  needs the network. On intermittent 2G this will be the most common complaint.

---

## 6. Already done

- `android.package` = `bi.imaraco.imaraafya`, `versionCode` 1
- Permissions declared explicitly and background location blocked
- Location asked for only on tap, never on launch, with a rationale string
- `eas.json` with development / preview / production profiles
- App name and description set
- Backend: HTTPS-ready, rate limited, token revocation, admin-gated content
