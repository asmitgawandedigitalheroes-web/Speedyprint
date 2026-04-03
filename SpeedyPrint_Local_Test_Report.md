# SpeedyPrint — Local QA Test Report

**Date:** 2026-04-02
**Site:** http://localhost:3000
**Supabase:** Remote (atqjywawohnhvlnggozu.supabase.co)
**Branch:** authentication-changes
**Tester:** Claude (Cowork / automated QA session)
**Source log:** SpeedyPrint_Bug_Fix_Log.md (base commit 9d3974e)

---

## 1. Fix Verification Summary

All 10 fixes from `SpeedyPrint_Bug_Fix_Log.md` were verified by browser inspection, source code grep, or both.

| Fix ID | Description | Verification Method | Result |
|--------|-------------|---------------------|--------|
| FIX-001 | Currency constants: INR/₹ → ZAR/R | Browser — product cards show "R 1,50", "R 150,00", "R 488.75" | ✅ Confirmed |
| FIX-002 | Stripe currency: `'inr'` → `'zar'` | Source code grep — both line items in `api/checkout/stripe/route.ts` read `currency: 'zar'` | ✅ Confirmed |
| FIX-003 | Terms of Service localisation | Browser — "South Africa", "South African Rand (ZAR)", "VAT at 15%", contact `info@speedyprint.co.za` | ✅ Confirmed |
| FIX-004 | Division TS error: `'events'` → `'race-numbers' \|\| 'mtb-boards'` | Browser — products?division=race-numbers returns results; source code shows updated guard | ✅ Confirmed |
| FIX-005 | Password complexity on reset-password page | Source code grep — 3 regex checks (uppercase, digit, special char) present in `reset-password/page.tsx` | ✅ Confirmed |
| FIX-006 | Password complexity on profile change-password | Source code grep — same 3 regex checks at lines 85–96 in `account/profile/page.tsx` | ✅ Confirmed |
| FIX-007 | Italic + Underline toggles in editor PropertiesPanel | Browser — opened designer, added text, confirmed **I** and **U** buttons toggle style; active state highlights blue | ✅ Confirmed |
| FIX-008 | Production filename: `_Date` component added | Source code grep — `dateStr` and `_${dateStr}.pdf` confirmed in `production/generator.ts` | ✅ Confirmed |
| FIX-009 | CSV duplicate detection for number-type columns | Source code grep — post-validation pass queries `number`-type params; error message format `Duplicate value "42" — already used on row 3` confirmed | ✅ Confirmed |
| FIX-010 | Canvas artboard boundary clamping | Source code grep — `canvas.on('object:moving', ...)` with `Math.min/Math.max` clamping to `artboardWidth/artboardHeight`; `canvas.off` in teardown confirmed | ✅ Confirmed |

**Fix Verification Totals:** 10/10 ✅ Confirmed · 0 ❌ Failed · 0 ⚠️ Partial

---

## 2. Full Site Test Summary

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 1 | Homepage | ✅ PASS | Hero renders; pricing chips show "R"; CTAs work |
| 2 | Products / Catalogue | ✅ PASS | Grid, filters, division nav, individual product pages all functional |
| 3 | Authentication | ⚠️ PARTIAL | Registration works; no post-register redirect (new bug); reset-password token flow requires valid Supabase link |
| 4 | Canvas Designer | ⚠️ PARTIAL | Core tools work; italic/underline confirmed; new text added at negative coordinates (new bug) |
| 5 | CSV Upload | ✅ PASS (code) | Validation + duplicate detection confirmed in source; full browser flow requires admin-created order |
| 6 | Proofing Workflow | ⚪ NOT TESTED | Requires admin credentials — not provided |
| 7 | Cart & Checkout | ⚠️ PARTIAL | Cart accessible; Stripe test mode configured (ZAR); PayFast not wired (OPEN-001) |
| 8 | Admin Panel | ⚪ NOT TESTED | Admin credentials not provided |
| 9 | Production Staff Panel | ⚪ NOT TESTED | Staff credentials not provided |
| 10 | Integration Tests | ⚪ NOT TESTED | Blocked by missing admin access and PayFast |
| 11 | Forms Audit | ✅ PASS | Contact form renders with SA address/phone; required field validation present |
| 12 | Static Pages | ✅ PASS | /terms, /faq, /about, /contact, /privacy, /404 all render correctly |
| 13 | Brand Consistency | ✅ PASS | "Speedy Labels" / "SpeedyPrint" branding consistent; ZAR pricing throughout |
| 14 | Console / Network Health | ⚠️ MINOR | 2 low-severity Next.js image warnings; no JS errors; no failed network requests |
| 15 | Responsive Layout | ✅ PASS | Hamburger menu (`lg:hidden`) present for <1024px viewports; desktop nav shown at ≥1024px |

---

## 3. Detailed Results

### Section 1 — Homepage

- Hero headline: "Labels & Stickers that make brands **unforgettable.**" renders correctly.
- Trust bar: "SOUTH AFRICA'S TRUSTED LABEL & STICKER PARTNER" badge visible.
- Hero pricing chip shows "FROM R1.50" confirming ZAR fix (FIX-001).
- Social proof: "4.9/5 · 2,000+ reviews · Free delivery over R500" — all ZAR.
- "Get Instant Quote" and "Browse Templates" CTAs navigate correctly.
- Product division grid on homepage loads all division cards.
- Footer: SA address, +27 phone number, correct `info@speedyprint.co.za` email.

### Section 2 — Products / Catalogue

- `/products` grid page loads all products with correct R pricing.
- Division filter (e.g., `?division=race-numbers`) returns filtered results — confirms FIX-004 resolves the stale `'events'` key.
- Individual product page (e.g., `/products/race-bibs`) renders: title, price calculator, "Design Online Instead" and "Upload Artwork" options.
- ProductConfigurator quantity/size/material selectors update price dynamically.
- "Add to Cart" and "Start Designing" buttons are present and interactive.

### Section 3 — Authentication

- **Register (`/register`):** Form accepts input; Supabase signup completes; confirmation toast appears. **Issue: page remains on `/register` instead of redirecting to `/account`.** (See NEW-001 below.)
- **Login (`/login`):** Email/password login tested successfully with freshly created account; redirects to `/account` dashboard correctly.
- **Reset password (`/reset-password`):** Navigating directly (without a valid token) immediately redirects to `/register`. This is correct behaviour — Supabase requires a valid recovery token in the URL; no bare-access bypass exists. **Not a bug.**
- **Password complexity:** Both reset-password and profile change-password pages have the 3 complexity checks confirmed in source (FIX-005, FIX-006); browser-level validation could not be triggered directly on reset-password due to token requirement.

### Section 4 — Canvas Designer

- Accessed via `/templates` → template card → `/designer/[uuid]`.
- Canvas loads with Fabric.js artboard; toolbar renders (text, shapes, image upload, layers, undo/redo).
- **FIX-007 confirmed:** Added a text element; scrolled PropertiesPanel to TEXT STYLE section; **I** (italic) button toggled `fontStyle` to italic — text visually italicised; **U** (underline) button toggled underline — confirmed active blue styling.
- Undo (Ctrl+Z) removed the object; redo restored it.
- Layer panel shows added objects; reordering available.
- **NEW-002:** Newly added text element coordinates display as X: -96, Y: -20 in properties — the object is partially placed off the artboard. Expected default placement: top-left corner of artboard (X: 0, Y: 0) or centred.
- Note: FIX-010 (boundary clamping on drag) is confirmed in code but could not be fully isolated as a browser test because the text element starts off-artboard before dragging.

### Section 5 — CSV Upload

- Source code confirms (`src/app/api/csv/upload/route.ts`):
  - Required field validation, numeric validation, length validation.
  - Post-format pass querying `number`-type parameters for duplicate detection.
  - Duplicate error format: `Duplicate value "42" — already used on row 3`.
- Full browser flow (upload CSV, map columns, confirm, generate files) requires an existing order from the admin panel — cannot be fully tested without admin credentials.

### Section 6 — Proofing Workflow

Not tested. Proofing requires: (a) a submitted order, (b) admin access to upload a proof PDF, (c) customer login to approve/reject. Admin credentials were not provided.

### Section 7 — Cart & Checkout

- Cart icon in header opens cart drawer; navigates to `/cart`.
- Cart page renders correctly with empty state ("Your cart is empty").
- Adding a product via ProductConfigurator adds it to cart; item appears with correct R price.
- "Proceed to Checkout" leads to `/checkout`.
- Stripe is configured in test mode with ZAR currency (FIX-002 confirmed).
- PayFast integration: `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE` are absent from `.env.local`. The PayFast payment option is not presented in the checkout UI. **(OPEN-001 — external dependency.)**

### Section 8 — Admin Panel

Not tested. No admin credentials were provided. The admin route (`/admin`) requires a user with the `admin` Supabase role/claim.

### Section 9 — Production Staff Panel

Not tested. No staff credentials were provided. The staff dashboard (`/staff`) requires the `production-staff` role.

### Section 10 & 11 — Integration Tests

Not tested. Full end-to-end (place order → admin approve → staff generate PDFs → Stripe webhook fire) requires admin access and PayFast wiring.

### Section 12 — Static Pages

| Page | Title | Status | Notes |
|------|-------|--------|-------|
| `/terms` | Terms of Service | ✅ | "South Africa", "ZAR", "VAT at 15%", `info@speedyprint.co.za` all confirmed (FIX-003) |
| `/privacy` | Privacy Policy | ✅ | Page renders; content uses SA/ZAR context |
| `/faq` | Frequently Asked Questions | ✅ | Accordion expand/collapse works; SA product context |
| `/about` | About Speedy Labels | ✅ | "South African printing business"; divisions listed as Labels, Race Numbers, MTB Boards |
| `/contact` | Contact Us | ✅ | Cape Town address; +27 phone; `info@speedyprint.co.za` and `orders@speedyprint.co.za`; contact form renders |
| `/404` (custom) | Page Not Found | ✅ | Custom branded 404 with red "404" heading, "Go home" + "Browse products" CTAs |

### Section 13 — Brand Consistency

- Site-wide branding: "Speedy Labels" (public brand name) consistent throughout all pages.
- All pricing uses ZAR (R symbol) — no remaining ₹ or INR references found.
- Email addresses: `info@speedyprint.co.za`, `orders@speedyprint.co.za` — consistent, correct domain.
- Footer, nav, and metadata reference South Africa / South African context.
- Header bar: "Part of The Direct Solutions Family of Brands" — consistent.

### Section 14 — Console / Network Health

No JavaScript runtime errors observed during any tested page visit.

Two low-severity Next.js image warnings noted:

1. `/images/logo.png` — Next.js `<Image>` component missing explicit `width: "auto"` or `height: "auto"` CSS for aspect ratio maintenance (layout shift risk).
2. `/images/products/custom-labels.png` — Next.js recommends `priority` prop for Largest Contentful Paint images; missing `priority` may cause performance metric warnings.

No failed network requests observed. Supabase API calls (auth, product queries) returned 200 responses.

### Section 15 — Responsive Layout

- Header nav uses `hidden ... lg:flex` Tailwind class: hidden below 1024px, visible at 1024px+.
- Hamburger "Open menu" button uses `lg:hidden` class: visible below 1024px, hidden at 1024px+.
- Pattern is correct: mobile gets hamburger; desktop gets full nav.
- Full interactive mobile screenshot testing was not possible in this session (CDP viewport is fixed at 1920px); Tailwind breakpoint analysis confirms correct responsive classes are in place.

---

## 4. New Bugs Found

| ID | Severity | Page / Component | Description | Recommended Fix |
|----|----------|-----------------|-------------|-----------------|
| NEW-001 | 🟡 Medium | `/register` | After successful registration, the page stays on `/register` with no redirect or clear success state. User must manually navigate to `/account` or login. | After Supabase `signUp()` resolves without error, redirect to `/account` (or `/login` with a success toast if email confirmation is required) |
| NEW-002 | 🟠 Medium | Canvas Designer | Newly inserted text element is placed at X: -96, Y: -20 — partially or fully off the artboard. FIX-010 only clamps position during drag, not on initial placement. | Set default `left`/`top` values on object insertion to place the object within artboard bounds (e.g., centred or at X: 20, Y: 20) |

---

## 5. Console / Network Errors

| Type | Severity | Description | Recommended Fix |
|------|----------|-------------|-----------------|
| Console Warning | 🟡 Low | `<Image>` for `/images/logo.png` — missing width/height CSS for aspect ratio | Add `style={{ width: 'auto', height: 'auto' }}` or explicit dimensions to the logo `<Image>` |
| Console Warning | 🟡 Low | `<Image>` for `/images/products/custom-labels.png` — should use `priority` as LCP image | Add `priority` prop to the above-the-fold product image |

No runtime JavaScript errors. No failed API/network requests observed.

---

## 6. Open Items (Environment — Not Code-Fixable)

| ID | Issue | Status | Action Required |
|----|-------|--------|-----------------|
| OPEN-001 | PayFast merchant credentials absent from `.env.local` | ⚪ Still Open | Client must create a PayFast merchant account and supply `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE` |
| OPEN-002 | `EMAIL_FROM` uses Resend sandbox domain (`onboarding@resend.dev`) | ⚪ Still Open | Client must verify a sending domain in the Resend dashboard and update `EMAIL_FROM` to e.g. `SpeedyPrint <noreply@speedyprint.co.za>` |

---

## 7. Platform Readiness Assessment

| Area | Verdict |
|------|---------|
| Bug fixes from audit (10/10) | ✅ All confirmed |
| Currency localisation (ZAR) | ✅ Complete |
| South Africa content localisation | ✅ Complete |
| Auth flows (register, login, reset) | ⚠️ Minor — post-register redirect missing |
| Canvas designer | ⚠️ Minor — default text placement off-artboard |
| CSV validation | ✅ Confirmed in code |
| Payment — Stripe (ZAR, test mode) | ✅ Configured |
| Payment — PayFast | ❌ Blocked (missing credentials) |
| Transactional email | ❌ Blocked (sandbox domain not verified) |
| Admin / Staff workflows | ⚪ Untested (credentials not provided) |
| Static pages & brand consistency | ✅ Complete |
| Responsive layout | ✅ Correct breakpoints in place |

**Overall Launch Readiness: 🟠 NOT READY — two external blockers must be resolved before go-live.**

---

## 8. Recommended Actions Before Going Live

Listed in priority order:

1. **[BLOCKER] Wire PayFast credentials** — Obtain `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, and `PAYFAST_PASSPHRASE` from the client's PayFast merchant account. Add to `.env.local` (and Vercel environment variables for production). Test a full PayFast sandbox checkout end-to-end.

2. **[BLOCKER] Verify Resend sending domain** — In the Resend dashboard, add and verify the `speedyprint.co.za` domain. Update `EMAIL_FROM` in `.env.local` to `SpeedyPrint <noreply@speedyprint.co.za>`. Test order confirmation and password reset emails.

3. **[MEDIUM] Fix post-registration redirect (NEW-001)** — After successful `signUp()`, redirect the user to `/account` or display a clear "Check your email to confirm your account" message with a link to `/login`. Currently the user is stranded on the `/register` page.

4. **[MEDIUM] Fix default canvas text placement (NEW-002)** — When inserting a new text element, ensure `left` and `top` default to coordinates within the artboard (e.g., centre of artboard or `{left: 20, top: 20}`).

5. **[LOW] Fix Next.js image warnings** — Add `priority` prop to the LCP product image on the homepage; add explicit width/height or `style={{ width: 'auto', height: 'auto' }}` to the logo `<Image>` component.

6. **[RECOMMENDED] Obtain admin/staff credentials and run full workflow QA** — The proofing workflow, admin order management, staff production generation, and full CSV-to-PDF pipeline were untested due to missing credentials. These should be verified before launch.

7. **[RECOMMENDED] Run Stripe webhook smoke test** — Confirm `STRIPE_WEBHOOK_SECRET` is correctly registered in the Stripe dashboard and that the webhook endpoint at `/api/webhooks/stripe` processes a test `payment_intent.succeeded` event and updates the order status in Supabase.

---

*Report generated: 2026-04-02 | Tester: Claude (Cowork automated QA)*
