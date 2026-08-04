<!-- Version: 1 | Date: 2026-08-03 | Changes: Initial creation. Phased plan for shipping Hearth to the iOS App Store and Google Play via Capacitor, with the offline/PWA foundation that clears Guideline 4.2. -->

# Hearth → App Store + Play Store: Native Pivot Plan v1

> **Status:** Plan, approved 2026-08-03. Execution follows the re-land house style in `hearth-refactor-postmortem-v1.md` §4 — one deliverable per PR, each green.
> **Audience:** Drew + any agent picking up a phase. Read the Context and Current-state findings before touching any phase; the store rules drive the architecture here, not the other way round.
> **Companion docs:** `docs/PROJECT_STATUS.md`, `hearth-notification-system-spec.md` (Phase 3 push scope), `drizzle-snapshot-recovery.md` (Phase 3 migration), `deployment-runbook.md`, `test-pilot-runbook.md`.

---

## Context

Hearth is a Next.js 16 web app on Vercel with an install manifest. It is **not** a PWA in any meaningful sense — there is no service worker anywhere in the repo, so an installed instance is a browser tab in a chrome-less window. The goal is to ship real native apps to the iOS App Store and Google Play without abandoning the built web product.

Three facts shape everything below:

1. **App Review tests airplane mode.** Today that yields a white screen. This is the most reliable way to earn a Guideline 4.2 ("not sufficiently different from a web browsing experience") rejection. Fixing it requires a real offline story — which the web PWA needs regardless.
2. **Australian storefront still mandates IAP for digital content.** Apple's external-purchase-link freedom is US-storefront-only; Play treats in-app digital goods the same way. [`/api/stripe/checkout`](src/app/api/stripe/checkout/route.ts) sells premium packs, so that surface cannot ship natively as-is.
3. **The app is deeply server-rendered** — Clerk server auth, Drizzle, runtime GROQ. Static export is impossible; an Expo/React Native rewrite discards a finished product.

### Decisions locked with Drew

| Decision | Choice |
|---|---|
| Shell | **Capacitor** wrapping the live app — one codebase, both stores, real native plugins |
| Commerce in v1 | **Strip digital purchases from native builds.** Web keeps Stripe untouched. IAP becomes release 2 |
| Stores | **Both, iOS first** — Apple is the harder gate; Android follows for near-zero marginal work |
| Developer accounts | **Drew handles enrolment.** Out of build scope (see *Drew's track*) |

---

## Current-state findings

**Already in good shape** — [account deletion](src/app/api/account/delete/route.ts) satisfies 5.1.1(v); privacy + terms pages exist; evidence photos are private-blob behind an auth proxy; PostHog runs with `autocapture: false` and no pageview capture, which keeps the privacy labels honest and narrow; [`use-online-status.ts`](src/hooks/use-online-status.ts) and [`use-logger-draft.ts`](src/hooks/use-logger-draft.ts) + `/api/logger/draft` are the right foundations for an offline queue.

**Gaps that block submission**

| Gap | Evidence |
|---|---|
| No service worker | Nothing matching `sw.js`/`service-worker*` in repo; no `serwist`/`next-pwa` dep |
| Thin manifest | [manifest.ts](src/app/manifest.ts) — one 512px icon, no maskable, no screenshots/shortcuts/id/scope |
| No `viewport` export | [layout.tsx](src/app/layout.tsx) has `metadata` but no `viewport` — no `viewport-fit=cover`, no `themeColor` |
| Digital purchase CTA | [PackDetailCta.tsx](src/components/pack/PackDetailCta.tsx), [MarketplaceCard.tsx](src/components/screens/MarketplaceCard.tsx), [MarketplaceShell.tsx](src/app/(auth)/explore/marketplace/MarketplaceShell.tsx) |
| Photo capture is a file input | `<input type="file" capture="environment">` in [QuickCapture.tsx](src/app/(auth)/module/[id]/_components/QuickCapture.tsx) and [EvidenceModal.tsx](src/app/(auth)/log/_components/EvidenceModal.tsx) |
| Notifications are in-app only | [/api/notifications](src/app/api/notifications/route.ts) reads a Postgres table; no APNs/FCM, no device-token storage |
| Clerk OAuth will break in a webview | Google returns `disallowed_useragent` for embedded webviews |

**Not a problem:** kits carry `priceAUD`/`stripePriceId` in [kit.ts](src/sanity/schemas/kit.ts) but are display-only via [PackIndicators.tsx](src/components/ui/PackIndicators.tsx) — no checkout path. Physical goods are IAP-exempt regardless, so kit *pricing display* can stay. Only the digital pack purchase needs stripping.

---

## Phase 1 — Offline + PWA foundation

Pure web work. Ships value to the web product independently of the native pivot, and is what defuses the airplane-mode test. **Do this first and merge it on its own.**

**Service worker.** ✅ Shipped as a hand-rolled [`public/sw.js`](public/sw.js) + [`ServiceWorkerRegistrar`](src/components/ServiceWorkerRegistrar.tsx).

> **Decision (2026-08-03): Serwist ruled out.** This build runs **Turbopack** (`▲ Next.js 16.2.1 (Turbopack)`), and `@serwist/next` — like `next-pwa` — is a **webpack plugin**. Under Turbopack it never executes; adopting it would have meant forcing `next build --webpack` for the whole app. Not a fallback taken under duress: it is the correct call for this stack.
>
> The only thing the plugin would have bought us is a precomputed asset manifest, and that turns out not to matter — Next's static output is content-hashed and immutable, so a `CacheFirst` rule over `/_next/static/` arrives at the same place after one visit. What must survive a *cold, offline* launch (the `/offline` document and the icons) is precached explicitly at install.
>
> Privacy rules baked into the worker, and deliberate: navigations are **never** cached (authenticated HTML carries children's names, photos and records, and would outlive sign-out); Vercel Blob evidence photos are **never** cached; `/api/` is never cached. Only public, non-personal assets are stored.
>
> **Kill switch:** `NEXT_PUBLIC_DISABLE_SW=1` unregisters any installed worker and drops its caches. A shipped service worker outlives the deploy that shipped it, so "stop serving it" is not a recovery path.

**New `/offline` route.** A branded Hearth screen — not a browser error — that names what *is* available offline and links to the Logger. This is the screen the reviewer sees in airplane mode.

**Offline Logger queue.** ✅ Shipped as [`src/lib/logger/outbox.ts`](src/lib/logger/outbox.ts) (16 unit tests, `fake-indexeddb`) + [`OutboxFlusher`](src/components/logger/OutboxFlusher.tsx), wired into `handleSave`'s offline branch. Closes the deferred D-LPS-10 sync-queue item.

- `buildEntrySavePayload` already produces the exact save payload; the outbox stores that object verbatim in IndexedDB and replays it against `POST /api/entries`.
- Three flush triggers (mount, `online`, `visibilitychange`) because none alone is reliable; `flushOutbox()` coalesces concurrent runs so an entry can never be posted twice.
- Retry policy: 4xx (except 408/429) is dropped as permanently rejected; 5xx counts an attempt against a cap of 5; **network failure counts no attempt at all** — a fortnight offline must not silently delete a parent's entry.
- Sync results are reported to the parent by toast. Silent sync leaves them unsure whether the entry they wrote on a bushwalk exists.

> **Scope call (2026-08-03): photo evidence is NOT queued offline.** Photos upload to Blob storage at *evidence-add* time ([EvidenceModal](src/app/(auth)/log/_components/EvidenceModal.tsx) → `/api/evidence/upload`), and the payload only ever carries the returned pathname. Deferring that upload means reshaping the `deriveEvidenceRows` / `derivePhotoEvidenceUrls` contract while the `learning_entry_evidence` dual-write is still in flight — disproportionate risk for this phase.
>
> Text, quote, note and link entries queue and replay in full. An entry whose photo was attached *before* the connection dropped also queues correctly, since its blob is already uploaded. Revisit alongside the Phase 3 native camera work, which reopens this path anyway.

**Manifest + viewport hardening.** Full icon set (192/512/1024, `any` + `maskable` as separate assets — the current single file does double duty and maskable will be visibly wrong), `screenshots`, `shortcuts` (Quick Log, Dashboard), `id`, `scope`, `orientation`, `categories`. Add a `viewport` export to [layout.tsx](src/app/layout.tsx) with `viewportFit: 'cover'` and theme colours per theme.

**Verify:** Lighthouse PWA audit ≥ 80 (Play's TWA bar). DevTools → Offline → app shell renders, Logger accepts an entry, entry appears after reconnect.

---

## Phase 2 — Capacitor shell

**Init.** `@capacitor/core` + `@capacitor/cli`, iOS + Android platforms. New top-level `capacitor.config.ts` and `ios/` + `android/` directories (both committed — they hold signing config, `Info.plist`, and native edits).

> ⛔ **BLOCKED on local toolchain (checked 2026-08-04).** `npx cap add ios/android` cannot run on this machine yet:
> - `xcode-select -p` → `/Library/Developer/CommandLineTools`. **Full Xcode is not installed**, so `xcodebuild` errors out.
> - **CocoaPods is absent** (`pod: command not found`) — `cap add ios` runs `pod install` as its final step.
> - **No JDK and no Android SDK** (`~/Library/Android/sdk` does not exist), so `cap add android` cannot run either.
>
> Needed from Drew, in this order: install **Xcode** from the App Store, then `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer` (needs his password — an agent cannot do this), then CocoaPods (`brew install cocoapods`). Android additionally needs a JDK + Android Studio.
>
> Everything in Phase 2 that is *not* the platform scaffold — native detection and the commerce strip — has shipped without it, since both are pure web code. Do not run a partial `cap add`: a half-created `ios/` directory that failed at `pod install` is worse than none.

**Server config.** `server.url` → production, `allowNavigation` for Clerk, Sanity CDN, and Blob hosts. Set `appendUserAgent: 'HearthNative/1'` — this is the detection hook for Phase 2b.

**Native detection — server-authoritative, to avoid hydration mismatch.** [`src/proxy.ts`](src/proxy.ts) already sets `x-pathname` on every response; add an `x-hearth-native` header from the UA check alongside it. Then:
- `src/lib/platform/native.ts` — `isNativeRequest(headers)` for server + API routes.
- A `NativeProvider` context set once in [`(auth)/layout.tsx`](src/app/(auth)/layout.tsx) (mirrored in `demo`/`dev-preview`), consumed by client components. Server and client agree by construction — no `window.Capacitor` reads during render.

**Commerce strip — defence in depth.** Client-side hiding alone is not enough; reviewers probe.
- `POST /api/stripe/checkout` returns **403** when `isNativeRequest()` — a modified client cannot initiate a purchase.
- `PackDetailCta` renders the *membership* branch for native regardless of `availability`, so premium packs read as "not available here" rather than showing a dead CTA. Same treatment in `MarketplaceCard` and `MarketplaceShell`.
- **No purchase language anywhere in native.** No "Get Pack", no prices on digital packs, no "buy on our website". Apple reads link-outs and hints as violations equally. Kit prices (physical materials) stay — verify the copy doesn't read as a digital CTA.
- Regression tests asserting the native branch renders no purchase affordance and the API 403s.

**Auth.** Clerk social sign-in must leave the webview via `@capacitor/browser` (`ASWebAuthenticationSession` / Chrome Custom Tabs). Requires universal links — `apple-app-site-association` and `assetlinks.json` served from the Vercel domain — to catch the redirect back.

> **Blocking check for Drew:** if *any* social provider (Google/Facebook) is enabled in Clerk, **Sign in with Apple is mandatory** under Guideline 4.8 and must be added to Clerk + entitlements. If sign-in is email-code only, this disappears. I can't read the Clerk dashboard — confirm before Phase 2 starts.

**Baseline plugins.** SplashScreen, StatusBar, Keyboard, App (hardware back button, deep links), Preferences.

---

## Phase 3 — Native capability (this is what clears 4.2)

Each item below is a genuine capability a browser tab cannot offer. Push is the single strongest signal; do it first.

**Push notifications.** `@capacitor/push-notifications` → APNs + FCM. New `device_tokens` table (familyId, clerkUserId, token, platform, timestamps) + registration endpoint; a send path layered over the existing `notifications` table so the in-app centre and push stay consistent. Scope v1 to the notification types that already exist — see `docs/hearth-notification-system-spec.md`. **Requires a Drizzle migration** — follow the snapshot recipe in `docs/drizzle-snapshot-recovery.md`, the generator is known to lump changes.

**Native camera.** `@capacitor/camera` replaces the file inputs in `QuickCapture.tsx` and `EvidenceModal.tsx` when native — real capture UI, gallery picker, no Safari upload sheet. Keep `compressImageFile` in the path. Needs `NSCameraUsageDescription` + `NSPhotoLibraryUsageDescription` strings that name the purpose plainly ("photograph your child's work to attach to a learning entry") — vague strings get rejected.

**Biometric app lock.** Optional Face ID / passcode gate on launch. Genuinely justified by children's names, photos, and encrypted facilitator notes; also a strong native-value signal. Settings toggle in [SettingsClient.tsx](src/app/(auth)/settings/SettingsClient.tsx).

**Native share sheet.** `@capacitor/share` for the portfolio/report PDFs already generated via jsPDF.

**Haptics.** Light impact on Quick Log save and badge-earned moments. Cheap, and it reads as native immediately.

---

## Phase 4 — Store compliance

**Age rating and category — get this right the first time.** Rate **4+**, positioned as a *parent's* tool. **Do not enter the Kids Category**: 5.1.4 bans third-party analytics, which would force PostHog and Sentry out. The app is parent-facing; that framing must be consistent across listing copy, screenshots, and description.

**Privacy.** Apple nutrition labels + Play Data Safety must both declare: contact info, user content (photos), identifiers, usage data (PostHog), diagnostics (Sentry). Play additionally requires a **publicly reachable account-deletion URL** — the existing in-app deletion is necessary but not sufficient; a public web page describing the path is needed.

**Assets.** 1024×1024 App Store icon; screenshots for 6.9" and 6.5" iPhone (+ 13" iPad *only if* iPad is declared supported — declaring it means the reviewer tests it, so decide deliberately); Play feature graphic + phone/tablet screenshots.

**Reviewer access.** A real working demo account with seeded family data. The existing `/demo` routes bypass Clerk and are useful context, but the reviewer needs genuine credentials to exercise the auth'd app.

**Export compliance.** HTTPS-only → standard exemption declaration.

---

## Drew's track (parallel, gates submission not build)

- Apple Developer Program. As a company this needs a **D-U-N-S number — 2–4 weeks**. This is the critical path; everything above can proceed without it, but nothing ships until it clears.
- Google Play Console. Personal accounts created post-2023 need **12 testers for 14 continuous days** of closed testing. The 10–20 pilot families map onto this well — worth starting the closed track as soon as an Android build exists.
- Confirm Clerk's enabled sign-in methods (see the 4.8 check in Phase 2).

---

## Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| 4.2 minimum-functionality rejection | **High** | Phases 1 + 3 are the entire answer. Do not submit before push + camera + offline are all live |
| Reviewer finds a purchase path | **High** | Server-side 403 + no purchase language + regression tests |
| ~~Serwist ↔ Next 16 integration friction~~ | — | **Resolved 2026-08-03.** Serwist is a webpack plugin and this build is Turbopack; hand-rolled worker shipped instead. See Phase 1 |
| Clerk OAuth blocked in webview | Medium | `@capacitor/browser` + universal links; email-code fallback |
| D-U-N-S delay | Medium | Drew's track, started now, runs parallel to all build work |
| Children's photos → privacy-label scrutiny | Medium | Accurate labels; stay out of Kids Category; deletion URL published |
| Remote-URL Capacitor reads as a wrapper | Medium | Native plugins + offline shell are the differentiator, not the load strategy |

---

## Verification

**Phase 1** — automated in [`e2e/offline-pwa.spec.ts`](e2e/offline-pwa.spec.ts), which drives the reviewer's exact flow via `context.setOffline(true)`: load the app, cut the network, navigate, assert Hearth's own offline screen appears rather than `ERR_INTERNET_DISCONNECTED`, then assert recovery when the network returns. **Requires a production server** — the worker refuses to register outside production:

```bash
npm run build && npm run start
npx playwright test offline-pwa.spec.ts
```

Plus `npm test` for the outbox unit tests.

**Phase 2** — `npx cap run ios` on simulator. Assert: no purchase CTA on a premium pack; `curl` the checkout endpoint with the native UA → 403; sign-in completes and returns to the app via universal link.

**Phase 3** — Push received on a physical device (simulators cannot receive APNs). Camera capture → evidence attached → visible in portfolio. Biometric lock engages on cold start.

**Pre-submission** — **Physical device in airplane mode.** Launch cold, confirm the branded offline screen, log an entry, restore network, confirm sync. This is the exact test the reviewer runs.

**Regression** — full `npm test` + `npm run test:integration:local` green before each store build. CI runs on PR only (feature-branch pushes don't trigger it), and lint is a hard gate that skips integration on failure.

---

## Sequencing

Phase 1 merges standalone as a web improvement. Phase 2 depends on it only for the offline screen. Phase 3 items are independent of each other and can land in any order — push first, since it carries the most 4.2 weight. Phase 4 runs alongside Phase 3.

I'd recommend one PR per phase-item rather than per phase, following the small-reviewed-PR pattern from the June refactor recovery documented in `docs/hearth-refactor-postmortem-v1.md`.
