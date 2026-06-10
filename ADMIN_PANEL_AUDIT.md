# Speedy Print — Admin Panel Audit Report
**Date:** 2026-06-09  
**Auditor:** Claude Code (automated code + runtime review)  
**Branch:** `authentication-changes`

---

## 1. Features Inventory

| # | Route | Feature | Status |
|---|-------|---------|--------|
| 1 | `/admin` | Dashboard — stats, recent orders, triage alerts | ✅ Working |
| 2 | `/admin/orders` | Order Pipeline — list / Kanban, bulk actions, filters | ✅ Working |
| 3 | `/admin/orders/[id]` | Order Detail — full order management, proofs, production, emails | ✅ Working |
| 4 | `/admin/proofs` | Proofs — list all proofs, filter by status, approve/revise | ✅ Working |
| 5 | `/admin/production` | Production Pipeline — generate files, bulk ZIP download | ✅ Working |
| 6 | `/admin/products` | Products — list, create, edit, delete product groups | ✅ Working |
| 7 | `/admin/products/new` | Create Product — form with live preview, auto-slug, images | ✅ Working |
| 8 | `/admin/templates` | Templates — grid/list view, create, edit, delete print specs | ✅ Working |
| 9 | `/admin/designs` | Designs — browse all customer designs, open in editor | ✅ Working |
| 10 | `/admin/users` | Users — list, search, role filter, pagination | ✅ Working |
| 11 | `/admin/users/[id]` | User Detail — edit profile, change role, view order history | ⚠️ Has bugs |
| 12 | `/admin/blog` | Blog — list, publish/unpublish, create, delete posts | ✅ Working |
| 13 | `/admin/testimonials` | Testimonials — create, edit, feature/unfeature, delete | ✅ Working |
| 14 | `/admin/settings` | Settings — business info, tax/shipping, social, branding | ✅ Working |
| 15 | `/admin/enquiries` | Enquiries — read, reply, mark as read, status filter | ⚠️ Has bugs |
| 16 | `/admin/audit-logs` | Audit Logs — full activity history, search, filter | 🔴 Has crash bug |
| 17 | `/admin/csv` | CSV Batch Jobs — monitor progress, view errors, download | ✅ Working |

---

## 2. Bugs Found

### 🔴 BUG-001 — CRITICAL: `cn` not imported in Audit Logs page (Runtime crash)
**File:** `src/app/admin/audit-logs/page.tsx`  
**Line:** 86  
**Severity:** Critical — page crashes at runtime when Refresh button is clicked

**Problem:** `cn()` is called in the JSX to conditionally animate the Refresh icon, but `cn` is never imported at the top of the file.
```tsx
// Line 86 — cn used but not imported → ReferenceError
<RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
```
The imports section (lines 1–20) only imports from `lucide-react`, `@/components/ui/...`, `@/lib/utils/format`, and `next/link`. No `cn` import.

**Fix:** Add `cn` import:
```tsx
import { cn } from '@/lib/utils'
```

---

### 🟠 BUG-002 — HIGH: `alert()` used instead of toast in User Detail page
**File:** `src/app/admin/users/[id]/page.tsx`  
**Lines:** 121, 125  
**Severity:** High — native browser `alert()` is jarring, breaks UI consistency, and blocks the page thread

```tsx
// Line 121 — should be toast.error()
alert('Failed to save changes')
// Line 125 — same
alert('Failed to save changes')
```

**Fix:** Import and use `toast` from sonner (already used across the rest of the admin):
```tsx
import { toast } from 'sonner'
// ...
toast.error('Failed to save changes')
```

---

### 🟠 BUG-003 — HIGH: `alert()` used in Order Detail production & ZIP download
**File:** `src/app/admin/orders/[id]/page.tsx`  
**Lines:** 135, 147  
**Severity:** High — same `alert()` consistency issue as BUG-002

```tsx
// Line 135
alert('Failed to generate production files')
// Line 147
alert(`Failed to generate ZIP: ${data.error || 'Unknown error'}`)
```

**Fix:** Replace with `toast.error(...)`.

---

### 🟡 BUG-004 — MEDIUM: `console.error` left in production code across multiple files
**Severity:** Medium — exposes internal error details in browser DevTools; should be stripped or replaced with proper error tracking

| File | Line | Statement |
|------|------|-----------|
| `src/app/admin/orders/[id]/page.tsx` | 134 | `console.error('Production generation error:', err)` |
| `src/app/admin/orders/[id]/page.tsx` | 195 | `console.error('Save notes error:', err)` |
| `src/app/admin/orders/[id]/page.tsx` | 270 | `console.error('Save tracking error:', err)` |
| `src/app/admin/orders/[id]/page.tsx` | 304 | `console.error('Ship error:', err)` |
| `src/app/admin/orders/[id]/page.tsx` | 358 | `console.error('Email send error:', err)` |
| `src/app/admin/users/[id]/page.tsx` | 97 | `console.error('User fetch error:', err)` |
| `src/app/admin/users/[id]/page.tsx` | 124 | `console.error('Save error:', err)` |
| `src/components/admin/ProofPanel.tsx` | 95 | `console.error('[ProofPreview] Proxy fetch failed:', err)` |

**Fix:** Remove or replace with a proper logger (e.g. Sentry, or at minimum `logger.error()`). The ProofPanel one is acceptable since it has a user-visible error message, but still should not expose raw error to console in production.

---

### 🟡 BUG-005 — MEDIUM: Silent catch in Templates page
**File:** `src/app/admin/templates/page.tsx`  
**Line:** 74  
**Severity:** Medium — errors are swallowed silently; the admin sees nothing if the delete or fetch fails

```tsx
} catch {
  /* silent */
}
```

**Fix:** At minimum show a toast error so admins know something went wrong:
```tsx
} catch {
  toast.error('Operation failed. Please try again.')
}
```

---

### 🟡 BUG-006 — MEDIUM: Enquiries reply dialog state leak on email warning
**File:** `src/app/admin/enquiries/page.tsx`  
**Lines:** 143–150  
**Severity:** Medium — dialog closes on success, then immediately re-opens if there's an email warning, but `replyError` is set in the re-opened dialog while the submit state is already cleared, leaving the UI in an ambiguous state

```tsx
setReplyTarget(null)          // close dialog
if (data.emailWarning) {
  setReplyError(data.emailWarning)
  setReplyTarget(replyTarget) // re-open it — stale closure value
}
```

React batches these updates in the same tick, so the dialog actually stays open (never closes). The comment says this is intentional, but the `setReplyTarget(null)` call is misleading and could break if React changes batching behaviour.

**Fix:** Restructure to avoid the null-then-set pattern:
```tsx
if (data.emailWarning) {
  setReplyError(data.emailWarning)
  // keep dialog open — do NOT setReplyTarget(null)
} else {
  setReplyTarget(null)
}
```

---

### 🔵 BUG-007 — LOW: `console.error` disguised as acceptable in ProofPanel fetch
**File:** `src/components/admin/ProofPanel.tsx`  
**Line:** 95  
**Severity:** Low — already has user-visible error message, but `console.error` should still be removed for production builds

---

### 🔵 BUG-008 — LOW: Hardcoded WhatsApp URL format in Settings
**File:** `src/app/admin/settings/page.tsx`  
**Line:** 107 (approx)  
**Severity:** Low — if admin enters number in local format (e.g. `0827001234` instead of `+27827001234`), the WhatsApp test link silently breaks with no feedback

**Fix:** Add format hint/validation and strip leading `0`, prepend `+27` if needed.

---

### 🔵 BUG-009 — LOW: UUID regex in Order Detail is overly strict
**File:** `src/app/admin/orders/[id]/page.tsx`  
**Line:** 965  
**Severity:** Low — design preview button only shows if `product_template_id` matches strict UUID v4 regex. If IDs ever use a different format (ULID, CUID) the button silently disappears.

```tsx
/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.product_template_id)
```

**Fix:** Either remove the regex guard (just check `item.design` and `item.product_template_id` are truthy) or use a UUID library.

---

### 🔵 BUG-010 — LOW: `state: any[]` types throughout admin
**Files:** Multiple admin pages  
**Severity:** Low — `useState<any[]>([])` is used heavily (e.g. audit-logs line 23). This loses type safety and could mask runtime shape mismatches from API changes.

**Fix:** Define typed interfaces matching the API response shapes and use them in state declarations.

---

## 3. Feature Coverage Summary

### Operations
| Feature | Create | Read | Update | Delete | Notes |
|---------|--------|------|--------|--------|-------|
| Orders | — | ✅ | ✅ Status/notes/tracking | — | Cannot create from admin; created by customers |
| Proofs | — | ✅ | ✅ Approve/revise | — | |
| Production | — | ✅ | ✅ Generate files | — | Bulk ZIP download works |
| CSV Jobs | — | ✅ | — | — | Read-only monitoring |
| Emails | — | — | ✅ Send 4 types | — | |

### Catalogue
| Feature | Create | Read | Update | Delete | Notes |
|---------|--------|------|--------|--------|-------|
| Products | ✅ | ✅ | ✅ | ✅ | Image uploader included |
| Templates | ✅ | ✅ | ✅ | ✅ | |
| Designs | — | ✅ | — | — | Open in editor via link |

### Content
| Feature | Create | Read | Update | Delete | Notes |
|---------|--------|------|--------|--------|-------|
| Blog Posts | ✅ | ✅ | ✅ Publish/unpublish | ✅ | |
| Testimonials | ✅ | ✅ | ✅ Feature/unfeature | ✅ | |

### Admin
| Feature | Create | Read | Update | Delete | Notes |
|---------|--------|------|--------|--------|-------|
| Users | — | ✅ | ✅ Profile, role | — | Cannot create via admin |
| Settings | — | ✅ | ✅ | — | All settings in one form |
| Enquiries | — | ✅ | ✅ Reply, mark read | — | |
| Audit Logs | — | ✅ | — | — | Read-only, search/filter |

---

## 4. Prioritised Fix List

| Priority | Bug | File | Effort |
|----------|-----|------|--------|
| 🔴 Fix immediately | BUG-001 — `cn` not imported, Audit Logs crashes | `audit-logs/page.tsx` | 1 line |
| 🟠 Fix soon | BUG-002 — `alert()` in User Detail | `users/[id]/page.tsx` | 2 lines |
| 🟠 Fix soon | BUG-003 — `alert()` in Order Detail | `orders/[id]/page.tsx` | 2 lines |
| 🟡 Next sprint | BUG-005 — Silent catch in Templates | `templates/page.tsx` | 1 line |
| 🟡 Next sprint | BUG-006 — Enquiries dialog state leak | `enquiries/page.tsx` | 4 lines |
| 🟡 Next sprint | BUG-004 — `console.error` cleanup (8 instances) | Multiple | Low |
| 🔵 Backlog | BUG-007 through BUG-010 | Multiple | Low |

---

## 5. What Is Working Well

- **Consistent UI system**: `AdminUI.tsx` shared components (`PageHeader`, `StatCard`, `FilterTabs`, `Pagination`, etc.) used consistently across all pages
- **Real-time indicators**: Auto-refresh polling (every 30s for pending proofs, 5s for CSV jobs)
- **Notification badges**: Sidebar badges for orders, proofs, CSV, enquiries, quotes
- **Role-based access**: Sidebar correctly hides sections for Production Staff role
- **Proof workflow**: Full approve/revise cycle with PDF preview via blob URL (base64 decode)
- **Production file generation**: PDF with bleed + bulk ZIP download working
- **Email system**: 4 customer email types (confirmation, payment, proof ready, shipped)
- **Bulk actions**: Multi-select orders → bulk status update works across Order Pipeline and Production
- **Audit trail**: Comprehensive audit log with actor, action, target, metadata, and time-ago display
- **Search + pagination**: Consistent debounced search and paginated tables across all list pages
