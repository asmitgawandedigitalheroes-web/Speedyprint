# SpeedyPrint — QA Bug Report

**Date:** 2026-03-31
**Tester:** QA (Browser Testing + Code Review)
**Method:** Playwright E2E Testing + Manual Code Review (4 agents)
**Environment:** `http://localhost:3000` (Next.js dev server)
**App:** SpeedyPrint — Custom sticker & label printing platform (South Africa)

---

## Testing Coverage

| Area | Method | Status |
|------|--------|--------|
| Authentication (login, register, reset password) | Browser + Code Review | ✅ Done |
| Homepage, Products, Cart | Browser | ✅ Done |
| Checkout & Payment (Stripe) | Browser + Code Review | ✅ Done |
| Admin Panel (orders, users, products, settings) | Browser + Code Review | ✅ Done |
| Design Editor (Fabric.js canvas) | Browser + Code Review | ✅ Done |
| Templates & Blog | Browser | ✅ Done |
| API Security & Auth | Code Review | ✅ Done |
| Middleware & Role-Based Access | Browser + Code Review | ✅ Done |

---

## Bug Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | 10 |
| 🟠 High | 11 |
| 🟡 Medium | 8 |
| 🟢 Low | 6 |
| **Total** | **35** |

---

## 🔴 CRITICAL Bugs

---

### BUG-001 — Production Staff Middleware Bypass (Privilege Escalation)

**File:** `src/lib/supabase/middleware.ts` — line 88  
**Confirmed Live:** Yes (tested with `prodstaff@speedyprint.com`)

**Description:**
The `PRODUCTION_STAFF_ALLOWED` array includes `'/admin'`. The restriction check uses `.startsWith(allowed + '/')` — since every admin sub-route starts with `/admin/`, **all routes pass** this check.

```ts
const PRODUCTION_STAFF_ALLOWED = [
  '/admin',          // ← BUG: this causes /admin/users, /admin/settings etc. to all pass
  '/admin/orders',
  '/admin/production',
  '/admin/proofs',
  '/admin/csv',
]
```

**Impact:** Production staff accessed `/admin/users` (all user emails visible) and `/admin/settings` (can change VAT rate, shipping costs).

**Suggested Fix:** Remove `'/admin'` from the array. The dashboard route `/admin` is already handled by the `pathname === allowed` exact match check.

---

### BUG-002 — Stripe Payments Completely Broken (500 Error)

**Endpoint:** `POST /api/checkout/stripe`  
**Console Error:** `Error: As per Indian regulations, only registered Indian businesses can accept international payments.`

**Description:**
The Stripe test account is registered as an Indian individual. ZAR (South African Rand) payments are considered international and are blocked by Stripe.

**Impact:** Every "Place order" attempt fails with HTTP 500. Zero revenue can be taken.

**Suggested Fix:** Create/migrate the Stripe account to a South African business entity registered on `stripe.com`.

---

### BUG-003 — Admin Settings API Has No Authentication

**File:** `src/app/api/admin/settings/route.ts` — GET and PUT handlers

**Description:**
Both handlers have **no `requireAdmin()` call**. Any unauthenticated visitor can:
- `GET /api/admin/settings` → read VAT rate, shipping cost, all business config
- `PUT /api/admin/settings` → set VAT to 0%, disable shipping charges, change any setting

**Suggested Fix:** Add at the top of both handlers:
```ts
const { error, status } = await requireAdmin()
if (error) return NextResponse.json({ error }, { status })
```

---

### BUG-004 — Admin Users API Has No Auth + Role Escalation Possible

**File:** `src/app/api/admin/users/[id]/route.ts` — GET and PUT handlers

**Description:**
No `requireAdmin()` on either handler. Any logged-in user can:
- Read any user's full profile and order history by guessing their UUID
- **Call `PUT /api/admin/users/{own_id}` with `{ role: "admin" }` to promote themselves to admin** — the `role` field is in `allowedFields`

**Suggested Fix:** Add `requireAdmin()` guard to both handlers. Also remove `role` from `allowedFields` in the PUT handler (role changes should use a dedicated endpoint with extra validation).

---

### BUG-005 — Stripe Checkout API Has No Authentication

**File:** `src/app/api/checkout/stripe/route.ts`

**Description:**
No auth check before creating Stripe sessions. Unauthenticated users can POST any order ID and receive a Stripe payment URL for that order.

**Suggested Fix:** Add authentication + ownership check:
```ts
const { user, error } = await getUser()
if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
if (order.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
```

---

### BUG-006 — Client-Supplied Order Prices Stored in DB (Price Manipulation)

**File:** `src/app/api/orders/route.ts` — line ~34  
**Also:** `src/app/api/checkout/stripe/route.ts` — line ~35

**Description:**
`unit_price`, `subtotal`, `tax`, `shipping_cost`, and `total` are all read from the client request body and inserted into the database without any server-side recalculation. A customer can set `total: 0.01` in their browser and get a legitimate order at any price.

**Suggested Fix:** Remove all price fields from the request body. Fetch pricing rules from DB server-side and recalculate:
```ts
const price = await calculatePrice(productId, quantity, params)
// Use price.total — never trust client-submitted prices
```

---

### BUG-007 — VAT Double-Charged in Stripe Line Items

**File:** `src/app/api/checkout/stripe/route.ts` — line ~42

**Description:**
VAT is added as a separate Stripe line item even though `order.total` already includes VAT. Every customer is overcharged by 15%.

**Suggested Fix:** Remove the VAT line item from the Stripe session. The product prices already include VAT. Only send actual product line items.

---

### BUG-008 — Shipping Not Included in Stripe Session (Revenue Loss)

**File:** `src/app/api/checkout/stripe/route.ts` — line ~60

**Description:**
`order.shipping_cost` (R85) is never added as a Stripe line item. The customer sees "Shipping: R85" in the checkout UI but Stripe charges R0 for shipping. The store loses shipping revenue on every completed order.

**Suggested Fix:** Add shipping as a line item:
```ts
{
  price_data: {
    currency: 'zar',
    product_data: { name: 'Shipping' },
    unit_amount: Math.round(order.shipping_cost * 100),
  },
  quantity: 1,
}
```

---

### BUG-009 — Cart Cleared Before Stripe Payment Confirmed

**File:** `src/app/(main)/checkout/page.tsx` — line ~158

**Description:**
The cart is cleared immediately after receiving the Stripe redirect URL — before the user even completes payment. If the user abandons at Stripe, closes the tab, or the payment fails, their cart is permanently gone and the order sits as "Pending Payment" forever.

**Suggested Fix:** Move cart clearing to the Stripe webhook handler (`checkout.session.completed` event), not before the redirect.

---

### BUG-010 — Register Form Silent Failure on Duplicate Email

**Page:** `/register`  
**Confirmed Live:** Yes (tested with `customer@speedyprint.com`)

**Description:**
Submitting registration with an existing email causes Supabase to return HTTP 422. The UI silently resets the form with zero feedback. The user has no idea what went wrong.

**Suggested Fix:** Catch the error from `supabase.auth.signUp()` and display: *"An account with this email already exists. Try signing in."*

---

## 🟠 HIGH Bugs

---

### BUG-011 — No Logout Button in Admin Sidebar

**File:** `src/components/layout/AdminSidebar.tsx`  
**Confirmed Live:** Yes — sidebar only has "Back to Site" link

**Description:**
No sign-out option exists within the admin panel. Admins and production staff must navigate back to the public site to log out. On shared/admin machines this is a security risk.

**Suggested Fix:** Add a logout button at the bottom of the sidebar that calls `supabase.auth.signOut()` and redirects to `/login`.

---

### BUG-012 — Open Redirect Vulnerability in Login/Middleware

**Files:** `src/lib/supabase/middleware.ts` line ~46, `src/app/(auth)/login/page.tsx` line ~18

**Description:**
The `redirect` and `next` URL parameters are consumed without validating they point to a relative path. An attacker crafts `/login?redirect=https://phishing.com` — after login, the user is silently redirected to an external site.

**Suggested Fix:**
```ts
if (redirect && !redirect.startsWith('/')) redirect = '/account'
```

---

### BUG-013 — No Rate Limiting on Login / Register

**Files:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`

**Description:**
No application-level rate limiting on auth endpoints. Accounts are vulnerable to brute-force password guessing. The in-memory rate limiter in `src/lib/rateLimit.ts` resets on every server restart.

**Suggested Fix:** Add Redis-backed rate limiting (Upstash) on auth routes: max 5 attempts per IP per 15 minutes with exponential backoff.

---

### BUG-014 — Sensitive User Data Persisted in localStorage

**File:** `src/hooks/useAuth.ts` — line ~158

**Description:**
Zustand `persist` middleware stores the full `user` object (email, ID, role) in `localStorage` unencrypted. Any XSS attack or malicious browser extension can read this data.

**Suggested Fix:** Only persist a minimal flag like `{ wasLoggedIn: true }`. Always re-fetch user data from Supabase on app load via `supabase.auth.getUser()`.

---

### BUG-015 — Supabase Error Messages Leaked to UI (User Enumeration)

**File:** `src/hooks/useAuth.ts` — lines ~39, ~73

**Description:**
Raw Supabase error messages (e.g., *"User with this email already exists"*) are passed directly to the UI. Attackers can probe which emails are registered by observing different error messages.

**Suggested Fix:** Map all auth errors to generic messages: *"Sign in failed. Please check your email and password."*

---

### BUG-016 — No Stripe Webhook Idempotency (Double Processing Risk)

**File:** `src/app/api/webhooks/stripe/route.ts`

**Description:**
Stripe retries webhooks if it doesn't receive a 200 response in time. If the DB update succeeds but the response times out, Stripe retries → `checkout.session.completed` processes twice → potential duplicate order fulfillment.

**Suggested Fix:** Store processed Stripe event IDs in a `webhook_events` table with a unique constraint. Skip processing if event ID already exists.

---

### BUG-017 — Checkout Success/Cancel Pages Don't Verify Order Ownership

**File:** `src/app/(main)/checkout/success/page.tsx` — line ~25

**Description:**
The success page renders order details from the `?orderId=` URL parameter without verifying the logged-in user owns that order. Anyone can view any order by guessing order IDs.

**Suggested Fix:**
```ts
if (order.user_id !== session.user.id) redirect('/account')
```

---

### BUG-018 — Customer Email Missing from Stripe Session

**File:** `src/app/api/checkout/stripe/route.ts` — line ~66

**Description:**
`customer_email: order.profile?.email` — but `profile` is not included in the Supabase query (missing `.select('*, profile:profiles(*)')`). The value is always `undefined`. Stripe receipts have no customer email.

**Suggested Fix:** Update the Supabase query to include: `.select('*, items:order_items(*), profile:profiles(*)')`.

---

### BUG-019 — File Upload MIME Type Check Bypassed via Extension Fallback

**File:** `src/app/api/upload/route.ts` — line ~59

**Description:**
If the MIME type check fails, the code falls back to checking the file extension. An attacker uploads `malware.exe` with `Content-Type: image/png` — the MIME check fails but the extension fallback accepts it.

**Suggested Fix:** Remove the extension fallback entirely. Reject if MIME type is not in `ALLOWED_MIME`. Optionally validate file magic bytes using the `file-type` npm package.

---

### BUG-020 — Stored XSS in Proof Customer Notes

**File:** `src/app/api/proofs/[id]/approve/route.ts` — line ~44

**Description:**
User-supplied `notes` is stored in `customer_notes` without HTML sanitization. If rendered in an HTML context without escaping, this is a stored XSS vector.

**Suggested Fix:** Sanitize input before storing: `DOMPurify.sanitize(body.notes)`, or ensure all display contexts escape HTML entities.

---

### BUG-021 — XSS in Design Editor SVG Generation

**File:** `src/components/editor/left-panels/TemplatesPanel.tsx` — line ~221

**Description:**
SVG previews are built by string-interpolating template names from the DB into an SVG string rendered via `dangerouslySetInnerHTML`. A malicious template name like `</text><script>alert(1)</script>` would execute.

```ts
const text = `<text ...>${label}</text>`  // label from DB, unsanitized
```

**Suggested Fix:** Use DOM APIs (`document.createElementNS`) instead of string interpolation, or sanitize with DOMPurify before assigning to innerHTML.

---

## 🟡 MEDIUM Bugs

---

### BUG-022 — Hardcoded `SITE_NAME` Causes Pervasive Branding Inconsistency

**File:** `src/lib/utils/constants.ts`

**Description:**
```ts
export const SITE_NAME = 'Speedy Labels'  // DB has 'SpeedyPrint'
```
Three different brand identities appear simultaneously on the same page:
- Top bar / nav header: **"Speedy Labels"** (from constant)
- Footer logo + copyright: **"SpeedyPrint"** (from DB)
- Top bar email: `info@speedylabels.co.za` vs footer: `info@speedyprint.co.za`

**Suggested Fix:** Remove the hardcoded constant. Read `site_name` from the `site_settings` DB row (already used in footer and admin settings page).

---

### BUG-023 — Duplicate Site Name in Page `<title>` Tags

**Pages:** `/blog`, `/templates`, and likely others

**Description:**
- `/blog` title: *"Blog | Speedy Labels | Speedy Labels"*
- `/templates` title: *"Design Templates | Speedy Labels | Speedy Labels"*

Site name is appended twice — bad for SEO and looks broken in browser tabs.

**Suggested Fix:** Check `generateMetadata()` in affected pages — the site name is likely being concatenated with a `metadataBase` template that already appends it.

---

### BUG-024 — Orders Created Before Payment Attempt (Orphan Orders Accumulate)

**Confirmed Live:** ORD-2026-0002 created as "Pending Payment" before Stripe even attempted

**Description:**
An order record (with order items) is created in the DB before the Stripe session is initialized. Every failed Stripe attempt (wrong card, user cancels, network error) leaves a permanent "Pending Payment" orphan order.

**Suggested Fix:** Either (a) create the order only after a successful Stripe session is created, or (b) implement a scheduled cleanup job that cancels "Pending Payment" orders older than 24 hours.

---

### BUG-025 — N+1 DB Query on Every Admin/Account Route Request

**File:** `src/lib/supabase/middleware.ts` — lines ~51, ~74

**Description:**
For every request to `/admin/*` and `/account/*`, middleware performs a `profiles` table lookup to check the user's role. Under load, this is a DB hit on every navigation click.

**Suggested Fix:** Cache the role in a short-lived signed cookie (e.g., 5-minute TTL) or as a Supabase JWT custom claim. Refresh only when auth state changes.

---

### BUG-026 — Missing Content-Security-Policy Header

**File:** `next.config.ts`

**Description:**
Security headers include HSTS and X-Frame-Options but no `Content-Security-Policy`. Without CSP, any XSS attack (see BUG-020, BUG-021) can exfiltrate data or load external scripts.

**Suggested Fix:** Add a strict CSP header in the `headers()` config:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; img-src 'self' data: blob:; ...
```

---

### BUG-027 — Design Editor Has No Auto-Save (All Work Lost on Refresh)

**File:** `src/lib/editor/useEditorStore.ts`

**Description:**
The editor Zustand store has no `persist` middleware. Refreshing the browser tab loses the entire canvas state and undo/redo history. There is no auto-save mechanism.

**Suggested Fix:** Add debounced auto-save (every ~10 seconds) that POSTs `canvas.toJSON()` to the designs API. Display an "Unsaved changes" indicator in the toolbar.

---

### BUG-028 — In-Memory Rate Limiter Resets on Server Restart

**File:** `src/lib/rateLimit.ts`

**Description:**
Rate limiter uses a plain `Map` in process memory. Any server restart (crash, deploy, cold start) resets all counters. Attackers can bypass by triggering a restart.

**Suggested Fix:** Migrate to Redis-backed rate limiting (Upstash Redis with `@upstash/ratelimit`).

---

### BUG-029 — Cart Badge Shows "99+" for Admin/Staff (Stale localStorage State)

**Confirmed Live:** Cart badge showed "99+" for production staff session

**Description:**
Cart state persists in localStorage across logins. When different users share a browser, or when a user logs out and back in, they inherit the previous session's cart count.

**Suggested Fix:** Clear the Zustand cart store on logout and on login (before loading the new user's saved cart).

---

## 🟢 LOW Bugs

---

### BUG-030 — Customer Test Account Login Returns HTTP 400

**Credentials:** `kunalgawande137@gmail.com / kunal@123`

**Description:**
Login returns HTTP 400 from Supabase — account likely has unconfirmed email or incorrect password. Blocked all customer dashboard testing (`/account`, `/account/orders`, `/account/designs`).

**Action:** Confirm email in Supabase dashboard or reset the password.

---

### BUG-031 — Blog Post Cards Have No Cover Images

**Page:** `/blog`

**Description:**
All blog post thumbnails show a document placeholder icon. No actual cover images are stored or displayed for any blog posts.

**Suggested Fix:** Add cover images to blog posts in the admin blog editor, or display a branded placeholder image instead of a generic icon.

---

### BUG-032 — Contact Page Shows Different Phone Number

**Page:** `/contact`

**Description:**
Contact page shows `+27 (0) 21 123 4567` while all other pages show `+27 12 345 6789`. Likely a hardcoded placeholder left in the component.

**Suggested Fix:** Read phone number from `site_settings` DB row (same as footer).

---

### BUG-033 — Canvas Event Listeners Not Cleaned Up (Memory Leak)

**File:** `src/components/editor/Canvas.tsx` — lines ~143, ~707, ~713

**Description:**
`canvas.on('mouse:wheel')`, `canvas.on('object:added')`, and `canvas.on('text:editing:exited')` are attached but never removed in the cleanup function. Causes memory leaks during long editing sessions or frequent route changes.

**Suggested Fix:**
```ts
// In cleanup useEffect return:
canvas.off('mouse:wheel')
canvas.off('object:added')
canvas.off('text:editing:exited')
```

---

### BUG-034 — Admin Sidebar Navigation Items Hidden Off-Screen

**File:** `src/components/layout/AdminSidebar.tsx`

**Description:**
When logged in as admin, "Users", "Testimonials", and "Settings" nav items are below the viewport with no visible scroll indicator. Users may not discover these sections.

**Suggested Fix:** Add a subtle scrollbar or bottom fade overlay to indicate more items below. Or reduce nav item padding so all items fit in a standard viewport height.

---

### BUG-035 — Weak Password Policy (8 Characters Only)

**Page:** `/register`

**Description:**
Password validation only requires 8 characters. No uppercase, number, or symbol requirement. Users can register with `password` or `12345678`.

**Suggested Fix:** Enforce complexity: at least 1 uppercase, 1 number, 1 special character. Update the placeholder text to communicate requirements clearly.

---

## Informational (Passed Tests)

| Feature | Result |
|---------|--------|
| Empty form validation on register | ✅ Browser-native validation fires |
| Password mismatch on register | ✅ "Passwords do not match" shown |
| Login → admin redirect for staff | ✅ Middleware chain works correctly |
| Forgot password link on login page | ✅ Correctly links to `/reset-password` |
| 404 page | ✅ Clean design with "Go home" + "Browse products" CTAs |
| Admin orders list | ✅ Status badges, search, filters all working |
| Admin products CRUD | ✅ Division tabs, template counts load correctly |
| Design editor canvas | ✅ Fabric.js loads, tools work, template gallery works |
| Checkout Step 1 → Step 2 flow | ✅ Province dropdown, form validation, address summary all work |
| Stripe webhook signature validation | ✅ Present and correct |
| PayFast IP + signature validation | ✅ Present and correct |

---

## Priority Fix Order

### Immediate (Before Any Production Traffic)

| # | Bug | Why Urgent |
|---|-----|-----------|
| 1 | BUG-003/004 | Anyone can escalate to admin or wipe settings right now |
| 2 | BUG-006 | Customers can pay any amount they choose |
| 3 | BUG-001 | Production staff can access all admin data |
| 4 | BUG-007/008 | Every payment overcharges VAT + loses shipping revenue |
| 5 | BUG-002 | Stripe account blocks all ZAR payments — zero revenue |

### This Week

| # | Bug | Why Important |
|---|-----|--------------|
| 6 | BUG-005/017 | Unauthenticated Stripe sessions + order enumeration |
| 7 | BUG-012 | Open redirect phishing attack vector |
| 8 | BUG-019/020/021 | File upload bypass + XSS vectors |
| 9 | BUG-009 | Cart lost on Stripe abandonment |
| 10 | BUG-011 | No logout in admin panel |

### Before Launch

| # | Bug | Why Important |
|---|-----|--------------|
| 11 | BUG-022 | Branding inconsistency visible to all users |
| 12 | BUG-027 | Users lose design work on every page refresh |
| 13 | BUG-013/028 | Brute-force protection is bypassable |
| 14 | BUG-016 | Webhook double-processing risk |
| 15 | BUG-023–029 | Polish, performance, and UX issues |

---

*Report generated by automated browser testing (Playwright) + 4 parallel code review agents.*  
*Total bugs found: 35 across Critical, High, Medium, and Low severities.*
