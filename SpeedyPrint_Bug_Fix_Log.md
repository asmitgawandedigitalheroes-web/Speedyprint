# SpeedyPrint — Bug Fix Log

**Date:** 2026-04-02
**Branch:** authentication-changes
**Base Commit:** 9d3974e
**Executed by:** Claude Code (claude-opus-4-6)

---

## Phase 0 — Issues Extracted from Audit Report

All `❌ Missing/Broken` and `⚠️ Partial` items from `SpeedyPrint_Test_Report.md` were extracted and grouped for verification.

---

## Phase 1 — Verification Results

| ID | Reported Issue | Verification Result | Status |
|----|---------------|---------------------|--------|
| BUG-001 | Currency hardcoded to INR (₹) | Confirmed: `CURRENCY = 'INR'`, `CURRENCY_SYMBOL = '₹'` in `constants.ts` | 🔴 Confirmed |
| BUG-002 | Stripe currency hardcoded to `'inr'` | Confirmed: two occurrences in `api/checkout/stripe/route.ts` (product line + shipping line) | 🔴 Confirmed |
| BUG-003 | Terms of Service has India/INR/GST content | Confirmed: "delivered across India", "Indian Rupee (INR)", "include GST", "speedylabels.co.za" | 🔴 Confirmed |
| BUG-004 | TypeScript error: `division === 'events'` in ProductConfigurator | Confirmed: TS2367 — 'events' not in Division union after `20260402_update_division_keys.sql` migration | 🔴 Confirmed |
| BUG-005 | Password complexity rules missing on reset-password page | Confirmed: only min-8 check present; no uppercase/digit/special-char validation | 🔴 Confirmed |
| BUG-006 | Password complexity rules missing on profile change password | Confirmed: same gap as reset-password page | 🔴 Confirmed |
| BUG-007 | Missing italic/underline toggles in editor PropertiesPanel | Confirmed: no `fontStyle` or `underline` controls in the text properties section | 🔴 Confirmed |
| BUG-008 | Production file naming missing `_Date` component | Confirmed: filename is `{OrderID}_{Product}_{Row}_{Name}.pdf` — no date segment | 🔴 Confirmed |
| BUG-009 | CSV upload has no duplicate value detection | Confirmed: validation loop checks required/numeric/length but never checks for duplicates | 🔴 Confirmed |
| BUG-010 | Canvas objects can be dragged outside artboard | Confirmed: no `object:moving` listener for boundary clamping in `Canvas.tsx` | 🔴 Confirmed |
| FP-001 | "Reorder button missing from order detail page" | FALSE POSITIVE — `handleReorder` function and conditional button render exist in `account/orders/[id]/page.tsx` | 🟢 False Positive |
| FP-002 | "Custom auth API routes missing (`/api/auth/*`)" | FALSE POSITIVE — Project uses Supabase Auth SDK client-side; no custom auth routes are needed or expected | 🟢 False Positive |
| OPEN-001 | PayFast credentials missing from `.env.local` | Confirmed missing. Cannot fix without merchant account credentials from client | ⚪ Still Open |
| OPEN-002 | `EMAIL_FROM` uses Resend sandbox domain (`onboarding@resend.dev`) | Confirmed. Requires verified domain setup in Resend dashboard — out of code scope | ⚪ Still Open |

---

## Phase 2 — Fixes Applied

### P1 — Blockers (Fixed First)

#### FIX-001 · Currency constants (INR → ZAR)
**File:** `src/lib/utils/constants.ts`
**Issue:** CURRENCY and CURRENCY_SYMBOL were set to Indian Rupee values, causing all price displays to show `₹` instead of `R`.
```diff
- export const CURRENCY = 'INR'
- export const CURRENCY_SYMBOL = '₹'
+ export const CURRENCY = 'ZAR'
+ export const CURRENCY_SYMBOL = 'R'
```

#### FIX-002 · Stripe currency (INR → ZAR)
**File:** `src/app/api/checkout/stripe/route.ts`
**Issue:** Both the product line items and the shipping line item used `currency: 'inr'`. Stripe would reject or charge in the wrong currency.
```diff
- currency: 'inr', // Indian Rupee (Temporary testing fix)
+ currency: 'zar',
```
*(Applied to both line item blocks — products and shipping)*

#### FIX-003 · Terms of Service localisation
**File:** `src/app/(main)/terms/page.tsx`
**Issue:** Multiple India-specific references left in content and metadata.
```diff
- 'printing services delivered across India.'
+ 'printing services delivered across South Africa.'

- 'All prices are quoted in Indian Rupee (INR) and include GST.'
+ 'All prices are quoted in South African Rand (ZAR) and include VAT at 15%.'

- "SpeedyPrint's" / "Speedy Labels'" (mixed branding)
+ "SpeedyPrint's" (consistent)

- info@speedylabels.co.za
+ info@speedyprint.co.za

- metadata description: "...conditions of use." (generic)
+ metadata description: "SpeedyPrint terms of service and conditions of use."
```

#### FIX-004 · TypeScript error — stale `'events'` division value
**File:** `src/app/(main)/products/[slug]/ProductConfigurator.tsx` (line 153)
**Issue:** TS2367 — comparison `division === 'events'` is always false because `'events'` was removed from the `Division` type in the `20260402_update_division_keys.sql` migration.
```diff
- const isEventsProduct = division === 'events'
+ const isEventsProduct = division === 'race-numbers' || division === 'mtb-boards'
```

---

### P2 — Core Features (Fixed Second)

#### FIX-005 · Password complexity on reset-password page
**File:** `src/app/(auth)/reset-password/page.tsx`
**Issue:** `handleUpdatePassword` only validated min-8 characters. Registration enforces uppercase + digit + special char. Inconsistent rules allow weak passwords via the reset flow.
```diff
  if (password.length < 8) { ... return }
+ if (!/[A-Z]/.test(password)) { setPasswordError('...uppercase letter.'); return }
+ if (!/[0-9]/.test(password)) { setPasswordError('...one number.'); return }
+ if (!/[^A-Za-z0-9]/.test(password)) { setPasswordError('...special character.'); return }
  if (password !== confirmPassword) { ... return }
```

#### FIX-006 · Password complexity on profile change password
**File:** `src/app/(dashboard)/account/profile/page.tsx`
**Issue:** Same gap as FIX-005 — `handlePasswordChange` was missing the three complexity regex checks.
*(Same three regex checks added in identical order)*

---

### P3 — Partial Implementations (Fixed Third)

#### FIX-007 · Editor italic and underline toggles
**File:** `src/components/editor/PropertiesPanel.tsx`
**Issue:** Text properties section had Font, Weight, and Align controls but no Italic or Underline toggles. Designers had no way to set these styles from the properties panel.
- Added `fontStyle: string` and `underline: boolean` to `ObjectProperties` interface
- Added sync in `useEffect` from active object: `fontStyle` and `underline`
- Added "Style" `PropertyRow` with two toggle buttons after the "Align" row:
  - **I** button toggles `fontStyle` between `'normal'` and `'italic'`
  - **U** button toggles `underline` between `true` and `false`
  - Active state shown with `bg-blue-50 border-blue-300 text-blue-700` (matches existing align button pattern)

#### FIX-008 · Production file naming — date component
**File:** `src/lib/production/generator.ts` (line 167)
**Issue:** CSV variable-data production files were named `{OrderID}_{Product}_{Row}_{Name}.pdf`. Spec requires a date segment for audit trail and collision avoidance.
```diff
+ const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
- const fileName = `${safe(orderNum)}_${productName}_${pad(rowIdx + 1)}_${primaryVal}.pdf`
+ const fileName = `${safe(orderNum)}_${productName}_${pad(rowIdx + 1)}_${primaryVal}_${dateStr}.pdf`
```
*Example output: `ORD-0042_RaceBib_001_JohnSmith_20260402.pdf`*

#### FIX-009 · CSV upload — duplicate detection for number-type columns
**File:** `src/app/api/csv/upload/route.ts`
**Issue:** Validation checked required/numeric/length but never detected duplicate values. Duplicate race numbers would silently produce multiple identical files, creating fulfilment errors.
- Added a post-format-validation pass that queries `template_parameters` for all `number`-type params
- For each such param, scans the parsed rows for duplicate values in the mapped CSV column
- Reports duplicate rows as `ValidationError` with format: `Duplicate value "42" — already used on row 3`
- Scoped to `number` type only to avoid false positives on legitimate multi-row text/select fields (e.g., many rows with `Color = "Red"`)

---

### P4 — Polish (Fixed Fourth)

#### FIX-010 · Canvas artboard boundary enforcement
**File:** `src/components/editor/Canvas.tsx`
**Issue:** Objects could be dragged outside the white artboard area. The `object:moving` event was never wired up for position clamping.
- Added `canvas.on('object:moving', ...)` listener after the existing selection events
- Reads `artboardWidth` / `artboardHeight` from the editor store state
- Clamps `obj.left` to `[0, artboardWidth - objScaledWidth]` and `obj.top` to `[0, artboardHeight - objScaledHeight]`
- Added corresponding `canvas.off('object:moving')` in the cleanup teardown

---

## Phase 3 — Summary

### Files Modified

| File | Change |
|------|--------|
| `src/lib/utils/constants.ts` | CURRENCY/CURRENCY_SYMBOL: INR/₹ → ZAR/R |
| `src/app/api/checkout/stripe/route.ts` | Stripe currency: 'inr' → 'zar' (×2) |
| `src/app/(main)/terms/page.tsx` | India/INR/GST → South Africa/ZAR/VAT; brand/contact fixed |
| `src/app/(main)/products/[slug]/ProductConfigurator.tsx` | Division check: 'events' → 'race-numbers' \|\| 'mtb-boards' |
| `src/app/(auth)/reset-password/page.tsx` | Added 3 password complexity regex checks |
| `src/app/(dashboard)/account/profile/page.tsx` | Added 3 password complexity regex checks |
| `src/components/editor/PropertiesPanel.tsx` | Added italic + underline style toggles |
| `src/lib/production/generator.ts` | CSV filename: added `_YYYYMMDD` date segment |
| `src/app/api/csv/upload/route.ts` | Added duplicate detection for number-type params |
| `src/components/editor/Canvas.tsx` | Added `object:moving` artboard boundary clamping |

### Verification Totals

| Outcome | Count |
|---------|-------|
| 🔴 Confirmed bugs fixed | 10 |
| 🟢 False positives dismissed | 2 |
| ⚪ Still open (external deps) | 2 |

### Still Open

| ID | Issue | Reason |
|----|-------|--------|
| OPEN-001 | PayFast not wired to checkout UI | Requires `PAYFAST_MERCHANT_ID` / `PAYFAST_MERCHANT_KEY` / `PAYFAST_PASSPHRASE` — merchant account must be set up by client first |
| OPEN-002 | `EMAIL_FROM` uses Resend sandbox domain | Requires a verified sending domain in the Resend dashboard; no code change can substitute for this |
