<!-- Version: 2.1 | Date: 2026-10-28 | Changes: v2.1 — Drew accepts Apple's commission for store placement: premium packs sell in-app through StoreKit 2 (reverses v1's "no digital purchases in native"). Native scope widened: Marketplace, pack detail, Library, module runner, planner and portfolio move to Swift. v2 — supersedes the Capacitor shell (v1 Phase 2) with a native SwiftUI app hosting web features in-app. -->

# Hearth iOS: Native SwiftUI + Web Hybrid Plan v2.1

> **Status:** Plan of record from 2026-10-28. Drew decided on a native Swift/Xcode app that ships **alongside** the web app (two clients, one backend, one repo) and will **pay Apple's commission** in exchange for App Store placement. Within reason, Swift is preferred over hosted web.
> **Supersedes:** [`hearth-native-app-plan-v1.md`](hearth-native-app-plan-v1.md) Phase 2 (Capacitor shell) and its "strip digital purchases from native" decision. v1 Phase 1 (offline/PWA, for the web) and Phase 4 (store compliance) still apply. Where this doc and v1 disagree, this doc wins.
> **Code:** [`apple/`](../apple/README.md). N0 (scaffold) and N1 (web bridge, server in PR #304) are built; the N3 StoreKit client layer is started.

---

## 1. The decisions and what they change

| | v1 (Capacitor) | v2.1 (this plan) |
|---|---|---|
| iOS client | Web app in a WKWebView | SwiftUI app. Native for everything parents do often; web hosted in native chrome for authoring, reports and visualisation |
| Navigation | Web bottom nav | Native: tab bar on iPhone, sidebar on iPad. Hosted pages render without their own nav |
| Sign-in | Clerk web in a webview | Clerk iOS SDK (`ClerkKit`); hosted pages signed in by a one-time ticket handoff |
| **Digital purchases** | **Stripped from native; IAP deferred** | **Premium packs sold in-app via StoreKit 2.** Apple's commission is accepted. Stripe stays web-only |
| Offline | Service worker + IndexedDB | Native outbox on disk, including photos |
| Guideline 4.2 risk | High | Low; the app is substantially native |
| Android | Capacitor shell | No native Android planned; Android uses the web/PWA ([SIDEBAR], §10) |
| Cost | One codebase | Two clients. The §3 rubric limits what goes native |

**Close, don't merge, PR #281** (Capacitor config). Keep the merged native UA detection (#278), `device_tokens` (#282) and `.well-known` routes (#283). #278's Stripe strip stays and matters more now: the only purchase path in the app must be StoreKit.

---

## 2. Principles (binding on every phase)

1. **One backend.** The Swift app talks only to `/api/*` on `www.hearth-lms.com` with a Clerk bearer token. It never reaches Postgres, Sanity or Blob storage directly and ships no server secrets. Native surfaces that need Sanity content get a JSON route that reads through `sanityServerClient` (the dotted-ID ACL rule, see `project_sanity_public_acl_dotted_id`).
2. **Native for what parents operate and browse; web for what they author, print or explore visually.** The rubric is in §3.
3. **Hosted web lives inside native chrome.** `WebFeatureView` sends the `HearthNative` UA marker; the web hides its own nav (N1) and every Stripe affordance (#278).
4. **One purchase path per platform.** In the iOS app, digital content is bought only through StoreKit: no Stripe button, web price, "cheaper on our website" copy or link-out, natively or in hosted web (Guideline 3.1.1, and the anti-steering rules for the AU storefront). On the web, Stripe as today. Entitlements are per family, so a pack bought on either platform is owned on both (3.1.3(b) multiplatform services).
5. **The server is the source of truth for ownership.** The app never unlocks content on a local StoreKit transaction alone. It sends the signed transaction to the server, which verifies it against Apple's certificate chain and writes the entitlement. The app then reads `/api/entitlements` like the web does.
6. **API changes are additive.** Shipped native builds lag the web. Never remove or rename a field the app reads until `minSupportedBuild` has passed it. Swift decodes tolerantly. `apple/HearthTests/Fixtures/` is the contract and is updated in the same PR as any route change.
7. **The architecture rules still hold.** No runtime LLM calls in native (Principle 4). Retrospective logging stays the heartbeat. Portfolio stays a filtered view. Membership-included content never shows transactional UI (Principle 7): StoreKit UI appears only on `premium` packs.
8. **Tablet is a first-class layout.** Layout follows size classes, not device type (§5).
9. **One design system.** Tokens are transcribed from `globals.css` into `apple/Hearth/DesignSystem/` and change in the same PR.

---

## 3. Feature split

**Rubric (v2.1, Swift-leaning).** A surface goes **native** when any two of these hold: used weekly or more; must work offline; uses device hardware; involves money; mostly browsing or reading lists; data shape is stable. It **stays web** when any of these hold: it's an authoring tool; it produces a print/PDF compliance artefact; it's a bespoke visualisation still in design; it runs once (onboarding); it's operator-only.

| Surface | Web route | iOS home | Phase | Why |
|---|---|---|---|---|
| Sign-in / sign-up | `/sign-in` | **Native** (ClerkKitUI) | N0 | Apple/Google sign-in can't run in a webview |
| Home (today) | `/dashboard` | **Native** | N0 | Daily |
| Logger | `/log` | **Native** | N2 | Core interaction; offline, camera, voice |
| Story: entries + detail | `/our-story` | **Native** | N0 → N4 | Daily review, photos |
| **Marketplace + pack detail** | `/explore/marketplace`, `/pack/*` | **Native** | **N3** | Money: StoreKit purchase must be native |
| **Library (owned packs, modules)** | `/library` | **Native** | **N3** | Browsing; pairs with purchase and restore |
| **Module runner** | `/module/*` | **Native** | **N5** | Used on co-op days and bushwalks; offline |
| **Planner** | `/planner` | **Native** (day list on iPhone, week grid on iPad) | **N5** | Weekly use; stable shape |
| **Portfolio browse** | `/our-story/portfolio` | **Native** (photo grid) | **N4** | Browsing photos |
| Learner profiles | `/our-story/learner/*` | **Native** read + light edit | N4 | Weekly |
| Notifications | `/notifications` | **Native** (push + centre) | N6 | Hardware + list |
| Activity Discovery | `/explore/activities` | **Native** | N5 | Browsing |
| Capabilities | `/our-story/capabilities` | Web | — | Visualisation; shares the constellation's model |
| Constellation | `/constellation` | Web | — | Visualisation in redesign |
| Reports, PDF | `/our-story/report` | Web; PDF to native share sheet | — | Compliance artefact; must match web exactly |
| Module Builder, Badge Creator | `/build/*` | Web | — | Authoring |
| Onboarding, pedagogy wizard | `/onboarding` | Web, hosted | — | Runs once |
| Family/account settings, deletion | `/settings` | Native shell + hosted web panels | — | Must match web; deletion defect open |
| Admin, Studio | `/admin`, `/studio` | **Excluded** | — | Operator-only |

That's 12 native surfaces and 6 hosted. Revisit a web surface only with a `hearth-research-log.md` finding.

---

## 4. Architecture

```
┌───────────────────────────── Hearth.app (SwiftUI) ─────────────────────────────┐
│ AppShell: TabView(.sidebarAdaptable): tab bar on iPhone, sidebar on iPad       │
│                                                                                │
│  Native features                              WebFeatureView (WKWebView)       │
│  Home · Log · Story · Marketplace · Library    Constellation · Reports         │
│  Runner · Planner · Portfolio · Settings      Builders · Onboarding           │
│        │                                       UA "HearthNative/ios"          │
│  APIClient ─ Bearer + X-Hearth-Client          ticket handoff on /sign-in      │
│  Outbox (file-protected)                                                       │
│  StoreService (StoreKit 2) ── signed transactions ──┐                          │
└────────┼────────────────────────────────────────────┼──────────────────────────┘
         ▼                                            ▼
   /api/* (Clerk auth())               /api/iap/apple/transactions (verify → entitlement)
                                       /api/iap/apple/notifications (App Store Server
                                        Notifications V2: refund/revoke)
```

**Auth handoff to hosted web (N1).** When a hosted page redirects to `/sign-in`, the app calls `POST /api/native/web-session { next }` (bearer). The server mints a single-use, 60-second Clerk sign-in token and returns `/native/handoff?ticket=…&next=…`. The public handoff page redeems it and replaces itself with `next`. `next` must be a same-origin relative path. The webview cookie store persists. Native sign-out clears it.

**Client identification.** Every call sends `X-Hearth-Client: ios/<version>(<build>)`. `GET /api/native/config` returns `{ minSupportedBuild, nativeSurfaces }`: an update gate, plus per-surface remote fallback to hosted web.

**Offline.** `Outbox` stores JSON under Application Support with `completeUnlessOpen` protection. It uses the web outbox's retry rules; the one native difference is that a 401 keeps the entry instead of dropping it. From N2, photos queue too.

### 4.1 Commerce (N3)

**Products.** Each `premium` pack is a **non-consumable** In-App Purchase. Product ID: `com.hearthlms.app.pack.<pack-slug>` (permanent once created). A new Sanity field `pack.appStoreProductId` sits beside `stripePriceId`, required for premium packs once iOS sells them. It is validated in the schema and flagged by Content QA when missing. Family Sharing is **off** for packs: ownership is per Hearth family account, not per Apple family.

**Purchase flow.**
1. Native pack detail loads `Product.products(for: [appStoreProductId])` and shows Apple's localised `displayPrice` (never the Sanity/Stripe AUD price).
2. `product.purchase(options: [.appAccountToken(familyId)])`. The family UUID binds the transaction to the Hearth account.
3. On `.success(.verified(transaction))`: `POST /api/iap/apple/transactions { signedTransaction: jwsRepresentation }`. Then `transaction.finish()`, **only after the server has accepted it**. Otherwise StoreKit redelivers the transaction through `Transaction.updates` on the next launch, which is the retry mechanism.
4. The server verifies the JWS with Apple's App Store Server Library (`@apple/app-store-server-library`, `SignedDataVerifier` with Apple root certs, bundle ID, environment). It checks that `appAccountToken` equals the caller's family ID, maps `productId` → `sanityPackId` (GROQ), and upserts the entitlement keyed on `originalTransactionId`. The write is idempotent, mirroring the Stripe webhook.
5. The app refreshes `/api/entitlements`; the pack shows **Owned**.

**Listener + restore.** `Transaction.updates` is observed from launch, for Ask to Buy approvals, purchases interrupted by a crash, and purchases made on another device. **Restore Purchases** (required by 3.1.1 for non-consumables) runs `AppStore.sync()` and re-posts every `Transaction.currentEntitlements` item.

**Refunds.** App Store Server Notifications V2 → `POST /api/iap/apple/notifications` (public route, self-authenticating via the signed payload, like the Sanity webhooks in `src/proxy.ts`). `REFUND` and `REVOKE` set `revoked_at` on the entitlement; `/api/entitlements` excludes revoked rows.

**Schema (one migration, additive).** `entitlements` becomes provider-neutral:
- add `provider text not null default 'stripe'`;
- make `stripe_session_id` nullable (its unique index still holds: Postgres allows multiple NULLs);
- add `app_store_original_transaction_id text` with a unique index, plus `app_store_environment text` and `revoked_at timestamp`;
- check constraint: a stripe row has a session ID; an app_store row has a transaction ID.
`UNIQUE(family_id, sanity_pack_id)` stays, so a family can't own a pack twice across providers. If they somehow pay twice (web, then iOS), the second insert conflicts and the server returns `alreadyOwned`. Native pack detail checks `/api/entitlements` *before* offering purchase, which closes most of that window.

**Pricing.** Same AUD price on both platforms; Drew absorbs the difference. Apple's cut is 15% under the Small Business Program (enrol before first sale) and 30% otherwise. Apple remits Australian GST on App Store sales, so net = price − GST − commission. Kits (physical goods) remain display-only and are IAP-exempt.

**Testing without an Apple account.** `apple/Hearth/Store/Hearth.storekit` is a local StoreKit configuration attached to the Debug scheme. It lets purchase, Ask to Buy, refund and failure paths run in the simulator, and `StoreKitTest` (`SKTestSession`) drives them in unit tests. Server verification in local dev uses Apple's Xcode-environment certificates, which the server library supports.

---

## 5. Tablet and responsiveness

- **Shell.** `TabView` with `.tabViewStyle(.sidebarAdaptable)`. The secondary section (Constellation, Reports, Settings) exists only at regular width. At compact width it would overflow the tab bar into "More" and displace Explore, so iPhone reaches it from Home's menu.
- **Size classes, not idiom.** iPad in ⅓ Split View gets the iPhone layout.
- **List/detail.** Story, Library and Marketplace use `NavigationSplitView`.
- **Grids.** `GridItem(.adaptive(minimum: 280–320))`: 1 column on phone, 2–3 on iPad.
- **Readable width.** Forms and reading columns cap at 680 pt.
- **Planner (N5).** Day list on compact; 7-column week grid on regular width.
- **Orientation.** iPhone portrait; iPad all four orientations plus multiple windows.
- **Input.** Pointer hover on cards; iPad keyboard shortcuts (⌘N new entry, ⌘↩ save, ⌘1–⌘5 tabs).
- **Verification sizes.** iPhone 17e, iPhone 18 Pro Max, iPad mini, iPad Pro 13" in both orientations, and iPad Pro 13" at ⅓ Split View.

---

## 6. Phases

Each phase is one or more small PRs that are each green (re-land house style, `hearth-refactor-postmortem-v1.md` §4).

### N0 — Scaffold ✅
XcodeGen project (`apple/project.yml`, synced folders), iOS 18+, iPhone + iPad, Swift 6 with MainActor default isolation, ClerkKit 1.6. Design system parity. Adaptive shell. Native Home, Story and Quick Log (outbox). `WebFeatureView`. Settings shell. Unit tests (contract fixtures, outbox, navigation policy, theme). Debug-only `-HearthDemo` / `-HearthTab` launch arguments for screenshots without a Clerk session.

### N1 — Web bridge (server) ✅ built in PR #304
The app side shipped with N0, plus the update gate (`UpdateGate`, `UpdateRequiredView`), which reads `GET /api/native/config` at launch and on foreground and fails open. Not yet built: `nativeSurfaces` and PostHog tagging. The `X-Hearth-Client` Sentry tag is done.

`POST /api/native/web-session` + public `/native/handoff` (ticket strategy, relative-`next` guard, tests); add `/native/handoff` to `isPublicRoute`. Chromeless `(auth)/layout.tsx` when `isNativeRequest()`. `GET /api/native/config`. Tag `X-Hearth-Client` in Sentry and PostHog.

### N2 — Native Logger
Logger spec v2 (Notice → Confirm) if merged, else the Quick tier. Camera + `PhotosPicker` evidence with offline-queued photos, on-device compression, on-device speech ([SIDEBAR] vs Deepgram), haptics, iPad inspector layout, ⌘N.

### N3 — Commerce (StoreKit 2) + Marketplace + Library
- **N3a (app, started):** `StoreService`: product loading, purchase with `appAccountToken`, `Transaction.updates` listener, restore, finish-after-server-ack. Local `.storekit` config and `StoreKitTest` suites.
- **N3b (server):** entitlements migration (§4.1); `/api/iap/apple/transactions`; `/api/iap/apple/notifications`; `pack.appStoreProductId` in Sanity + Content QA rule; `/api/entitlements` excludes revoked rows. Unit + integration tests (verifier mocked in unit, real Postgres in integration).
- **N3c (app):** native Marketplace (search via `/api/marketplace/search`), pack detail (Apple price, Owned state, Restore), Library. A JSON catalogue route for pack/module summaries (`/api/native/v1/packs`, `sanityServerClient`, published-gated per `check-sanity-gating`).

### N4 — Story, learners, portfolio
Entry detail with evidence images through the auth proxy, enrichment from the snapshot, edit/delete. Learner profile read + light edit. Native portfolio photo grid (filtered view of entries; no separate store).

### N5 — Module runner, planner, activity discovery
Runner first, working offline for a downloaded module, since it's used on co-op days and bushwalks. Then planner (day list / week grid) over `/api/planner`, and Activity Discovery. Each ships behind `nativeSurfaces` so it can fall back to hosted web without an App Review cycle.

### N6 — Platform capability
APNs send path over `notifications` → `device_tokens`; native notification centre. Face ID lock. Widgets ("Log today", "This week"). App Intents / Shortcuts. Share extension (photo → evidence draft). Universal links (`applinks:www.hearth-lms.com`).

### N7 — Store submission
v1 Phase 4: rated 4+, parent's tool, not the Kids Category, privacy labels (now including **Purchases**), reviewer demo account with a premium pack available to buy in the sandbox, HTTPS export exemption. iPad declared, so 13" iPad screenshots are required. Sign in with Apple enabled (4.8). IAP products submitted *with* the build (first IAPs must ship with a version). Pre-submission: airplane-mode test on a physical device, plus a full sandbox purchase → refund → revoke cycle.

---

## 7. Drew's track (gates device builds, sandbox purchases and submission; not simulator work)

1. Apple Developer Program enrolment (D-U-N-S, 2–4 weeks) → Team ID.
2. **App Store Connect: Paid Apps agreement, banking and tax forms.** Without these, StoreKit returns no products, even in sandbox.
3. **App Store Small Business Program enrolment** (15% instead of 30%) before the first sale.
4. **Create the IAP products** (one non-consumable per premium pack, IDs per §4.1) and an **In-App Purchase key** (`.p8`, key ID, issuer ID) for the server's App Store Server API calls, stored in Vercel env.
5. Set the **App Store Server Notifications V2 URL** to `https://www.hearth-lms.com/api/iap/apple/notifications` (production and sandbox).
6. Clerk: enable the Native API, register the iOS app (Team ID + `com.hearthlms.app`), enable Sign in with Apple.
7. APNs key for N6.
8. Close #281. Confirm the app name and bundle ID (permanent after first submission).

---

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| A Stripe price, button or link appears anywhere in the iOS app | **High** (rejection, anti-steering) | #278 UA strip + checkout 403 (shipped); native-UA test sweep over hosted routes in N1; native marketplace in N3 so purchase UI is ours |
| Content unlocked without payment (forged or replayed transaction) | **High** | Server-side JWS verification against Apple's chain; `appAccountToken` must equal the caller's family; idempotent on `originalTransactionId`; unlock reads only `/api/entitlements` |
| Paid but not unlocked (server down mid-purchase) | Medium | `finish()` only after server ack, so StoreKit redelivers; Restore re-posts all current entitlements |
| Refund keeps access | Medium | ASSN V2 `REFUND`/`REVOKE` → `revoked_at` |
| Double purchase across web and iOS | Low | Owned check before purchase; `UNIQUE(family, pack)` returns `alreadyOwned`; support refunds the duplicate via App Store |
| Two clients drift | **High** | §3 rubric; contract fixtures; same-PR token changes; `nativeSurfaces` remote fallback |
| App Review delay blocks a native fix | Medium | Logic on the server; `nativeSurfaces` switch; hosted web hotfixes instantly |
| Children's data on device | Medium | File protection; Face ID lock (N6) |
| Solo developer maintaining Swift + TS | Medium | 12-surface ceiling; every native surface keeps a hosted-web fallback |
| Account deletion defect reaches a reviewer | **High** | Fix before N7 (`hearth-account-deletion-defect-v1.md`) |

---

## 9. Economics (for Drew's model, not a forecast)

For an AUD price **P** sold in-app: Apple remits GST (P/11), then takes its commission on the GST-exclusive amount. Under the Small Business Program, net ≈ P × 10/11 × 0.85 ≈ **0.77P**. At 30%, ≈ 0.64P. Stripe on the web nets roughly P × 10/11 − (1.75% + 30c) once Hearth remits GST itself. Check current Apple and Stripe rates before pricing; these figures are a planning sketch.

---

## 10. Open questions

- **[SIDEBAR] Android.** (a) web/PWA only (recommended now); (b) a Play TWA, which would then also need Play Billing for packs; (c) Kotlin later.
- **[SIDEBAR] Membership as a subscription.** Today "membership" is free, with no billing. If it becomes paid, iOS needs an auto-renewable subscription with the same server pattern (`DID_RENEW` / `EXPIRED` notifications). Design it once for both platforms.
- **[SIDEBAR] On-device voice vs Deepgram** for the native Logger (N2).
- **[BUILD] Logger spec v2 merge timing** decides whether N2 builds Notice → Confirm or the Quick tier.

---

## 11. Verification

- `apple/scripts/test.sh`: XCTest/Swift Testing on an iPhone and an iPad simulator, including StoreKitTest purchase paths. No macOS CI runner yet (Actions minutes cap), so it runs locally before each `apple/` PR.
- Manual matrix per §5 sizes, both themes, largest Dynamic Type, VoiceOver on Home, Log and pack detail.
- Server: `npm test` + `npm run test:integration:local` for every N1/N3b change; the IAP verifier gets fixture JWSs from the Xcode StoreKit environment.
