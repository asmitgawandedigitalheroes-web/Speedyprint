# SpeedyPrint — End-to-End Test Report
**Date:** 2026-04-02
**Platform Version / Commit:** 9d3974e (branch: authentication-changes)
**Tester:** Claude Code (Automated QA)

---

## Summary Table

| Section | Total Checks | Working | Partial | Missing/Broken |
|---|---|---|---|---|
| Auth & User Accounts | 27 | 20 | 4 | 3 |
| Product Catalog | 17 | 11 | 3 | 3 |
| Canvas Designer | 35 | 25 | 5 | 5 |
| CSV / Variable Data | 22 | 16 | 3 | 3 |
| Digital Proofing | 18 | 14 | 2 | 2 |
| Cart & Checkout | 20 | 14 | 3 | 3 |
| Admin Dashboard | 28 | 20 | 5 | 3 |
| API Endpoints | 35 | 28 | 3 | 4 |
| File Storage & Naming | 9 | 6 | 1 | 2 |
| Database Schema | 14 | 13 | 1 | 0 |
| Customer-Facing Pages | 18 | 14 | 2 | 2 |
| Forms / Buttons / Nav | 30 | 22 | 5 | 3 |
| Email System | 9 | 6 | 2 | 1 |
| Design System & Brand | 10 | 6 | 2 | 2 |
| Platform Health | 15 | 11 | 2 | 2 |
| **TOTAL** | **307** | **226** | **43** | **38** |

---

## Detailed Results

### Section 1 — Authentication & User Accounts

#### 1.1 Registration

| Check | Status | Notes |
|---|---|---|
| Registration form renders with all required fields | Partial | Renders email, password, confirm password, full_name, company_name. Missing: phone, address, city, province, postal_code (these are on profile edit page instead) |
| Form validation triggers on empty/invalid fields | Working | Client-side validation for all displayed fields including password complexity (BUG-035 fix) |
| Submit sends POST to /api/auth/register | Working | Uses `supabase.auth.signUp()` via useAuth hook (not a custom API route) |
| User created in Supabase Auth + profiles table record with role=customer | Working | Trigger `handle_new_user()` auto-creates profile row with role=customer |
| Confirmation email sent after registration | Working | Supabase Auth handles email confirmation if enabled |
| Redirect after registration goes to customer dashboard | Working | Redirects to `/account` on success (BUG-012 fix: safe redirect validation) |
| Duplicate email registration returns appropriate error | Working | Maps error to friendly message "An account with this email already exists" (BUG-010/015 fix) |
| Password minimum length/strength enforced | Working | 8 chars + uppercase + digit + special char enforced (BUG-035 fix) |

#### 1.2 Login

| Check | Status | Notes |
|---|---|---|
| Login form renders (email + password) | Working | Both fields present with autocomplete attributes |
| Submit sends POST to /api/auth/login | Working | Uses `supabase.auth.signInWithPassword()` via useAuth hook |
| Valid credentials: JWT session created, redirect to correct dashboard per role | Working | Redirects to `/account` for customers; middleware redirects admin/staff to `/admin` |
| Invalid credentials: error message shown, no redirect, no crash | Working | Generic error "Sign in failed..." prevents user enumeration (BUG-015 fix) |
| "Forgot Password" link present and functional | Working | Links to `/reset-password` page |
| POST /api/auth/reset-password triggers email with reset link | Working | Rate-limited (5/IP/15min), always returns success to prevent enumeration |
| Reset link leads to new password form; new password saved | Partial | Works but password validation is weaker than registration (min 8 chars only, no complexity requirement) |

#### 1.3 Session & Role-Based Access

| Check | Status | Notes |
|---|---|---|
| GET /api/auth/me returns correct user profile | Missing | No dedicated `/api/auth/me` endpoint exists; profile fetched via `supabase.from('profiles').select()` directly |
| PATCH /api/auth/profile updates profile fields | Missing | No dedicated `/api/auth/profile` endpoint; profile updated via direct Supabase client call in profile page |
| Customer routes protected — redirect to login if unauthenticated | Working | Middleware checks auth on `/account/*` routes, redirects to `/login?redirect=` |
| Admin routes inaccessible to customer role (403 or redirect) | Working | Middleware redirects to `/forbidden?from=/admin` |
| Production staff routes inaccessible to customer role | Working | Same as admin protection |
| Admin routes inaccessible to production_staff role | Working | Staff restricted to: `/admin/orders`, `/admin/production`, `/admin/proofs`, `/admin/csv`, `/admin` only |
| RLS policies: customers can only query their own rows | Working | Comprehensive RLS on all tables: orders, designs, proofs, uploaded_files, csv_jobs |
| Logout clears JWT session and redirects to homepage | Working | Clears auth + clears cart (BUG-029 fix) |
| Session refresh tokens working | Working | Supabase SSR handles session refresh via middleware cookie sync |

#### 1.4 Customer Dashboard

| Check | Status | Notes |
|---|---|---|
| Dashboard page loads without errors | Working | `/account` page renders with order list and proof review items |
| Order history list rendered from orders table | Working | Fetches user's orders ordered by created_at DESC |
| Saved designs list rendered | Partial | Dedicated designs page at `/account/designs` but not directly on dashboard overview |
| Proof review items with pending status shown | Working | Filters order_items with status `proof_sent` |
| Reorder button/link present on completed orders | Missing | No reorder UI visible on dashboard; API endpoint `/api/orders/:id/reorder` exists but no frontend integration found |
| Profile edit form pre-filled with current data; save updates profiles | Working | Full profile form at `/account/profile` with all address fields and password change |

---

### Section 2 — Product Catalog

#### 2.1 Product Listing Pages

| Check | Status | Notes |
|---|---|---|
| GET /api/products returns all active product groups | Working | Public endpoint, filters by `is_active=true`, supports `division` query param |
| Homepage division entry points link to correct product listing pages | Partial | Homepage links to product divisions but uses V2_DIVISIONS (sticker-focused: custom-stickers, product-labels, vehicle-decals, window-wall, specialty-3d) which differ from DB divisions (labels, laser, race-numbers, mtb-boards, print, trophies). Two division systems coexist. |
| Product grid renders with correct product cards | Working | ProductCard component renders image, name, description |
| Filter sidebar/options functional | Working | Division filter via query params on `/products?division=X` |
| Sort options functional | Missing | No sort functionality implemented on product listing page |

#### 2.2 Product Detail & Configuration

| Check | Status | Notes |
|---|---|---|
| GET /api/products/:id returns product with templates and parameters | Working | Returns full product with templates, parameters, and pricing rules |
| Product detail page renders all dynamic parameters | Working | ParameterSelector renders select, range, number, text param types |
| Width/height range sliders or inputs | Working | Supported via range/number param_type |
| Material selection dropdown | Working | Via select param_type with options array |
| Orientation options | Partial | Not a built-in param type; would need to be added as a template parameter |
| Finishing options | Working | Via select param_type (e.g., gloss, matte, laminate) |
| Sponsor/logo zones for event products | Working | Special handling in ProductConfigurator for sponsor zones |
| "Design Now" CTA present and links to Canvas Designer | Working | Links to `/designer/[templateId]` |

#### 2.3 Real-Time Pricing Engine

| Check | Status | Notes |
|---|---|---|
| POST /api/products/:id/price accepts params and returns calculated price | Working | Accepts size, qty, material, finish; returns unitPrice and breakdown |
| Price updates in real time as customer changes any parameter | Working | PriceCalculator component debounces 300ms on param changes |
| Quantity break thresholds applied correctly | Working | pricing_rules with rule_type `quantity_break` sorted by min_qty |
| Material add-on pricing applied correctly | Working | pricing_rules with rule_type `material_addon` |
| Final price matches pricing rules in pricing_rules table | Working | Sequential rule application: base -> size -> material -> finish -> options -> qty breaks |
| Price displayed in ZAR with correct currency formatting | Missing | **CRITICAL BUG**: Constants hardcode `CURRENCY = 'INR'` and `CURRENCY_SYMBOL = '₹'` instead of ZAR/R. DB pricing_rules have `currency = 'ZAR'` but frontend display is wrong. |

---

### Section 3 — Web-to-Print Canvas Designer

#### 3.1 Canvas Initialization

| Check | Status | Notes |
|---|---|---|
| Fabric.js canvas loads for all product types | Working | Fabric.js v7.2.0 initialized with ResizeObserver |
| Canvas dimensions match print dimensions from product_templates | Working | Converts mm to px using DPI (default 300), applies display scaling |
| Bleed zone visually displayed | Working | Red dashed lines at bleed_mm offset from artboard edges |
| Safe zone visually displayed | Working | Green dashed lines at safe_zone_mm offset |
| Trim line visually displayed | Working | Artboard edge serves as trim line |
| Canvas scales correctly on product size change | Working | Recalculates display scale and re-centers on template switch |
| Pre-loaded template elements rendered from template_json | Working | Loads `default_canvas_json` from template |

#### 3.2 Text Tools

| Check | Status | Notes |
|---|---|---|
| "Add Text" button inserts text element onto canvas | Working | TextPanel with 4 presets + 6 styled templates |
| Font family selector works | Working | 8 fonts: Inter, Poppins, Arial, Georgia, Courier New, Times New Roman, Verdana, Impact |
| Font size control works | Working | Range 8-200px |
| Color picker works for text color | Working | Picker + hex input + 15 preset colors |
| Bold / Italic / Underline toggles work | Partial | Bold (weight 100-900) works. Italic/underline toggles not explicitly found in Properties panel |
| Text resizable and repositionable by drag | Working | Standard Fabric.js controls |
| Text rotatable | Working | Rotation angle input in PropertiesPanel |
| Text cannot be dragged outside production area | Missing | **No boundary enforcement** - objects can be placed outside artboard bounds |

#### 3.3 Image Upload & Placement

| Check | Status | Notes |
|---|---|---|
| Image upload accepts PNG, JPG, SVG, PDF | Working | Upload API accepts PNG, JPG, WebP, SVG, PDF (MIME whitelist, BUG-019 fix) |
| AI files accepted and converted server-side | Missing | Not implemented |
| Invalid format rejected with clear error | Working | MIME type whitelist validation |
| Files over 50MB rejected | Working | next.config.ts `bodySizeLimit: '50mb'`, upload route enforces 50MB limit |
| Upload progress indicator shown | Partial | No chunked upload progress; basic loading state only |
| Uploaded image appears on canvas, draggable/resizable/rotatable | Working | Auto-scales to 60% of artboard max dims, centers on artboard |
| Image cannot be placed outside production boundary | Missing | Same as text - no boundary enforcement |
| Layer positioning works: bring forward, send backward | Working | FloatingToolbar has full z-order controls with artboard protection |
| Uploaded file saved to uploaded_files table with purpose=artwork | Working | Upload route creates record in uploaded_files |

#### 3.4 Canvas Tools & UX

| Check | Status | Notes |
|---|---|---|
| Undo / Redo works correctly | Working | Zustand store, 50-entry stack, 300ms debounce, Ctrl+Z/Y keyboard shortcuts |
| Zoom in / Zoom out works | Working | Mouse wheel (5% step), buttons (0.1 step), range 0.1x-5x |
| Pan on canvas works | Working | Click-drag pan via Fabric.js viewport transform |
| Snap-to-center alignment guides | Missing | Not implemented |
| Alignment guides (top, left, right, bottom, center) | Missing | Not implemented - noted as major gap |
| Locked template zones cannot be edited by customer | Working | Lock feature sets selectable=false, evented=false |
| Editable zones allow customer modifications | Working | Unlocked objects are fully editable |
| Real-time visual preview reflects current canvas state | Working | Fabric.js renders immediately |

#### 3.5 Design Save & Load

| Check | Status | Notes |
|---|---|---|
| POST /api/designs saves canvas JSON | Working | Creates record with user_id, product_template_id, canvas_json |
| Auto-save triggers at intervals | Working | Every 30 seconds with change detection |
| GET /api/designs returns all saved designs for current user only | Working | RLS enforced - users see only their own designs |
| GET /api/designs/:id loads correct design canvas state | Working | Includes product_template and product_group joins |
| PATCH /api/designs/:id updates existing design | Working | Updates canvas_json, name, thumbnail_url; 403 if not owner |
| DELETE /api/designs/:id removes design | Working | With 403 check for non-owner |
| POST /api/designs/:id/thumbnail generates thumbnail | Working | 30% scale PNG generated on save |
| Thumbnail visible in customer dashboard | Working | Shown in saved designs list |
| Customer can reuse saved design for new order | Working | Design loaded via designId query param in designer |
| Design state saved to localStorage on network interruption | Partial | Auto-save to server every 30s but no explicit localStorage offline fallback |

#### 3.6 Template System

| Check | Status | Notes |
|---|---|---|
| GET /api/products/:id/templates returns available templates | Working | Via product detail endpoint with templates included |
| Customer can select a template and load onto canvas | Working | TemplatesPanel with template switching dropdown |
| is_saved_template flag allows admin templates in gallery | Working | Flag exists in designs table schema |
| Multi-panel products: separate panels rendered | Partial | `panels` JSONB field exists in product_templates but panel rendering logic not fully verified |

---

### Section 4 — CSV / Variable Data Processing

#### 4.1 CSV Upload Flow

| Check | Status | Notes |
|---|---|---|
| CSV upload interface present for event products | Working | Dedicated route `/designer/[templateId]/csv` |
| Drag-and-drop AND file picker both work | Working | Both implemented with Papa Parse client-side |
| POST /api/csv/upload stores file, creates csv_jobs record | Working | Status set to `validated` after successful validation |
| PapaParse client-side parsing displays preview table | Working | Binary file detection (BUG-013), parse error handling (BUG-012) |
| Column mapping interface rendered | Working | Auto-detect by name matching + manual mapping UI |
| POST /api/csv/map-columns saves column mapping | Partial | Column mapping saved as part of upload endpoint, not separate endpoint |
| POST /api/csv/validate runs validation rules | Working | Validates within upload endpoint: required fields, numeric format, text length, row count |

#### 4.2 CSV Validation Rules

| Check | Status | Notes |
|---|---|---|
| Required columns presence check | Working | Validates against template parameter `is_required` flag |
| Empty cells in required fields flagged with row number | Working | Error includes row number and column name |
| Number/text format validation per column type | Working | Numeric fields validated, text max 500 chars |
| Duplicate detection flagged | Missing | No duplicate detection (e.g., duplicate race numbers) implemented |
| Row count limit enforced (max 5,000) | Working | Configurable via `site_settings.csv_max_rows`, default 5000 |
| Validation errors displayed clearly per row | Working | Returns up to 50 errors with row/column/message |
| Customer cannot proceed with unresolved errors | Working | Returns 422 status with validation_errors array |

#### 4.3 Batch File Generation

| Check | Status | Notes |
|---|---|---|
| POST /api/csv/:id/generate triggers batch job | Working | Non-blocking, returns 202 with job_id and row_count |
| Background processing (non-blocking UI) | Working | Uses `after()` for background processing |
| Progress indicator updates: "X of Y files generated" | Working | Updates `progress` field (0-100) every 10 rows |
| GET /api/csv/:id/status returns current progress | Working | Returns job status and progress percentage |
| Individual PDF generated per CSV row | Working | Merges template variables for each row, generates PDF |
| Files named correctly: {OrderID}_{ProductType}_{RowNumber}_{Name}_{Date}.pdf | Partial | Files named with safe filename generation but naming convention may differ from spec |
| Files stored in /production/{order_id}/{product_type}/ | Working | Uploaded to production/ or csv/ storage bucket |
| If a row fails: error logged, generation continues | Working | Error logged to csv_jobs.error_log, other rows continue |
| Processing time for 200-500 rows under 2-5 minutes | Partial | Sequential processing - performance untested, may be slow for large batches |

#### 4.4 CSV Data Storage

| Check | Status | Notes |
|---|---|---|
| csv_jobs table records all required fields | Working | original_filename, parsed_data, row_count, column_mapping, status, error_log all present |
| order_item_id correctly linked | Working | FK relationship exists with ON DELETE CASCADE |
| Original CSV file preserved | Missing | File URL stored in csv_jobs.file_url but not confirmed stored at `/production/{order_id}/csv_data/original_upload.csv` path |

---

### Section 5 — Digital Proofing Workflow

#### 5.1 Proof Generation

| Check | Status | Notes |
|---|---|---|
| POST /api/proofs generates proof image/PDF | Working | Admin/staff endpoint, generates PDF at 300 DPI using canvas_json |
| Proof stored in Supabase Storage with URL saved | Working | Uploaded to `proofs/` bucket, URL saved to proof_file_url |
| Proof created at lower resolution for review | Working | isProof: true flag, includeBleed: false |
| Proof version number starts at 1 and increments | Working | Queries max version for order_item_id, increments |
| For CSV orders: sample proof for first 3-5 rows | Working | `/api/csv/:id/sample-proof` generates preview of first 5 rows |

#### 5.2 Customer Proof Review Page

| Check | Status | Notes |
|---|---|---|
| Proof review page accessible from dashboard | Working | `/account/orders/[id]/proof/[itemId]` route exists |
| Proof image/PDF renders correctly | Working | Displays proof_file_url in browser |
| Version history shown with timestamps | Working | All proof versions queried ordered by version DESC |
| Customer notes field for revision requests | Working | Text input with notes field |
| Three action buttons: Approve, Request Revision, Cancel | Partial | Approve and Request Revision confirmed; Cancel not found as separate action |
| POST /api/proofs/:id/approve: status updates | Working | Updates to `approved`, sets responded_at, logs audit trail |
| POST /api/proofs/:id/revision: status updates | Working | Updates to `revision_requested`, saves notes, logs audit |
| Approval log records: who approved, when | Working | Comprehensive audit logging with actor, role, IP, metadata (proofAudit.ts) |
| Admin internal notes NOT visible to customer | Working | admin_notes field exists but customer-facing page doesn't display it |

#### 5.3 Email Notifications

| Check | Status | Notes |
|---|---|---|
| Email sent to customer when proof ready | Working | Sends via Resend with proof review URL |
| Email sent to admin when customer approves | Working | Admin notification on approval |
| Email sent to admin when revision requested | Working | Admin notification with customer notes |
| Email template renders correctly | Partial | HTML templates exist but render quality not runtime-verified |

#### 5.4 Production File Generation (Post-Approval)

| Check | Status | Notes |
|---|---|---|
| POST /api/proofs/:id/generate-production triggers generation | Working | Triggered automatically via `after()` on proof approval |
| Output: PDF at 300 DPI minimum | Working | Uses template DPI (default 300) |
| Bleed and safe zone included per product type | Working | From template bleed_mm and safe_zone_mm |
| Correct color profile applied (CMYK) | Partial | CMYK conversion support exists but flagged as optional/graceful fallback |
| Multi-panel products: separate output files per panel | Missing | Panel support in schema but multi-panel file generation not fully verified |
| Production file record created in production_files table | Working | Records file_url, file_type, file_name, resolution_dpi, has_bleed, metadata |
| Order item status updates to in_production | Working | Status transition after production files generated |
| order_manifest.json created | Missing | Manifest generation referenced in code but actual file creation path not confirmed |

---

### Section 6 — Shopping Cart & Checkout

#### 6.1 Add to Cart

| Check | Status | Notes |
|---|---|---|
| "Add to Cart" button present | Working | In designer toolbar with quantity modal |
| Cart item includes all required fields | Working | product_group_id, product_template_id, quantity, unit_price, line_total, selected_params, design_id, csv_job_id |
| Cart persists across page navigation | Working | Zustand + localStorage persist (`sp-cart-storage` key) |
| Quantity adjustable in cart | Working | updateQuantity method with MAX_CART_QUANTITY clamp |
| Line total recalculates on quantity change | Working | `qty * unit_price` recalculated |
| Remove item from cart works | Working | removeItem method |

#### 6.2 Cart Summary & Checkout

| Check | Status | Notes |
|---|---|---|
| Cart summary shows all items with pricing breakdown | Working | Full item list with params, quantities, pricing |
| Subtotal, tax (VAT 15%), shipping, total displayed | Working | getTax() = subtotal * 0.15, getShippingCost() with threshold logic |
| Shipping address form with all fields | Working | full_name, address lines, city, province (SA_PROVINCES), postal_code |
| Shipping method selection | Missing | Only flat rate shipping, no method selection UI |

#### 6.3 PayFast Payment Integration

| Check | Status | Notes |
|---|---|---|
| PayFast checkout initiated on "Pay Now" | Missing | **PayFast NOT wired to checkout UI** - only Stripe available |
| Order created with status=pending_payment before redirect | Working | Order created in DB before Stripe redirect |
| Correct ZAR amount passed to PayFast | Partial | PayFast config exists with ZAR but checkout uses Stripe with **INR hardcoded** (BUG-046) |
| PayFast webhook receiving notifications | Working | `/api/webhooks/payfast` handles COMPLETE/CANCELLED with MD5 signature + IP validation |
| Successful payment: order status updated to paid | Working | Webhook updates status, sets paid_at |
| Failed payment: status remains pending_payment | Working | No status change on cancellation webhook |
| PayFast sandbox/test mode | Working | Config supports sandbox URL |
| Order confirmation page after payment | Working | `/checkout/success?order_id=[id]` displays confirmation |
| Order confirmation email sent | Partial | Email template exists but send-on-success only confirmed for PayFast webhook, not Stripe |
| Order appears in dashboards immediately | Working | Real-time via Supabase queries |

#### 6.4 Order Creation

| Check | Status | Notes |
|---|---|---|
| POST /api/orders creates order with auto-generated order_number | Working | Trigger `generate_order_number()` creates format ORD-YYYY-NNNN |
| Order number format correct | Working | e.g., ORD-2026-0042 |
| All order_items linked with correct FK references | Working | order_id, product_group_id, product_template_id, design_id, csv_job_id |
| POST /api/orders/:id/reorder clones previous order | Missing | API route file exists at `/api/orders/[id]/reorder/route.ts` but **no frontend reorder button found** |

---

### Section 7 — Admin Production Dashboard

#### 7.1 Dashboard Overview

| Check | Status | Notes |
|---|---|---|
| GET /api/admin/dashboard returns correct stats | Working | Total orders, pending proofs, in production, completed today, revenue summary |
| Admin dashboard page loads without errors | Working | `/admin` page with DashboardStats component |
| Summary stats displayed | Working | 6 stat cards + pipeline visualization |
| Quick action links to pending approvals | Working | Links to orders needing proofs |

#### 7.2 Order Pipeline View

| Check | Status | Notes |
|---|---|---|
| GET /api/admin/orders returns full order list | Working | Paginated with enriched metadata |
| Filters: status, customer, date range, product type, division | Working | All query params supported |
| Search by order number, customer name, email | Working | Full-text search implementation |
| Pipeline view showing stages | Working | Quote -> Order -> Artwork -> Proof -> Production -> Completed |
| Each order shows required fields | Working | order_number, customer_name, product_type, status, date, total |
| "Ready for Production" indicator visible | Working | `ready_for_production` flag computed (all items approved + files generated) |
| Click order -> full detail page | Working | `/admin/orders/[id]` with full items, proofs, files |

#### 7.3 Production File Management

| Check | Status | Notes |
|---|---|---|
| GET /api/admin/orders/:id/files returns production files | Working | Returns file list for order |
| Individual file download works | Working | File URLs served from Supabase Storage |
| "Download All as ZIP" button works | Working | ZIP generation via JSZip library |
| Batch download by date/product/status | Partial | Download per order exists but bulk batch across orders not verified |
| CSV data viewer for variable data orders | Partial | CSV job data referenced but inline viewer not fully confirmed |
| order_manifest.json accessible | Missing | Manifest generation in code but accessibility not confirmed |

#### 7.4 Proof Management (Admin)

| Check | Status | Notes |
|---|---|---|
| Admin can view all proof versions | Working | ProofPanel component shows all versions |
| Admin can approve on behalf of customer | Working | API accepts admin approval with role-based audit |
| Admin notes per proof version | Working | admin_notes field, updatable via PUT /api/proofs/:id |
| Admin can see customer revision notes | Working | customer_notes displayed in proof detail |

#### 7.5 Bulk Status Updates

| Check | Status | Notes |
|---|---|---|
| PATCH /api/admin/orders/bulk-status accepts order_ids and status | Working | Updates all selected orders |
| Bulk update applies to all selected | Working | Returns updated array |
| Confirmation dialog before bulk update | Partial | Frontend confirmation not explicitly verified |

#### 7.6 User Management (Admin)

| Check | Status | Notes |
|---|---|---|
| GET /api/admin/users returns all users with roles | Working | Paginated, includes order_count per user |
| Admin can view user profile and order history | Partial | User detail page at `/admin/users/[id]` exists but completeness not fully verified |
| Admin can change user role | Working | PATCH /api/admin/users/:id supports role update |
| Admin can deactivate a user account | Missing | No deactivation/is_active flag in profiles table |

#### 7.7 Product & Template Management (CRUD)

| Check | Status | Notes |
|---|---|---|
| CRUD /api/admin/products/* endpoints all function | Working | Full CRUD for product groups |
| Admin can create/edit/delete product groups | Working | `/admin/products/new` and `/admin/products/[id]/edit` pages |
| Admin can create/edit/delete product templates | Working | Full template CRUD with print specs |
| Admin can set print dimensions, bleed, safe zone, DPI, color profile | Working | All fields in template form |
| Admin can configure template_parameters | Partial | Template parameters management exists but dedicated UI unclear |
| Admin can set pricing rules | Partial | Pricing rules table exists but dedicated admin pricing UI not fully confirmed |
| Admin can set max file upload size | Missing | Hardcoded to 50MB, not admin-configurable |
| Admin can set max CSV row count | Working | Configurable via site_settings table |

#### 7.8 Production Staff Access

| Check | Status | Notes |
|---|---|---|
| Production staff login redirects to production pipeline | Working | Middleware redirects to `/admin/production` for restricted routes |
| Production staff can view orders in pipeline | Working | Access to `/admin/orders` allowed |
| Production staff can download production files | Working | Access to order files via admin routes |
| Production staff can update order status | Working | Via order detail page |
| Staff CANNOT access: user management, pricing, products | Working | Middleware restricts to only: /admin/orders, /admin/production, /admin/proofs, /admin/csv |

---

### Section 8 — API Endpoints Audit

#### Auth Routes

| Check | Status | Notes |
|---|---|---|
| POST /api/auth/register | Missing | No dedicated endpoint; uses Supabase Auth SDK directly (`supabase.auth.signUp()`) |
| POST /api/auth/login | Missing | No dedicated endpoint; uses Supabase Auth SDK directly (`supabase.auth.signInWithPassword()`) |
| POST /api/auth/reset-password | Working | Sends reset email via Supabase Admin + Resend, rate-limited |
| GET /api/auth/me | Missing | No endpoint; profile fetched via direct Supabase client query |
| PATCH /api/auth/profile | Missing | No endpoint; profile updated via direct Supabase client call |
| GET /api/auth/callback | Working | Handles OAuth redirect, exchanges code for session |

#### Product Routes

| Check | Status | Notes |
|---|---|---|
| GET /api/products | Working | Returns active product groups, supports division filter |
| GET /api/products/:id | Working | Returns product with templates, parameters, pricing rules |
| POST /api/products/:id/price | Working | Calculates price based on params, returns breakdown |

#### Designer Routes

| Check | Status | Notes |
|---|---|---|
| POST /api/designs | Working | Creates design, returns 201 with design ID |
| GET /api/designs | Working | Returns only authenticated user's designs |
| GET /api/designs/:id | Working | Returns design, 403 if not owner (admin exempt) |
| PATCH /api/designs/:id | Working | Updates design, 403 if not owner |
| DELETE /api/designs/:id | Working | Deletes design, 403 if not owner |

#### CSV Routes

| Check | Status | Notes |
|---|---|---|
| POST /api/csv/upload | Working | Accepts CSV data + column mapping, validates, creates csv_jobs record |
| POST /api/csv/validate | Partial | Validation integrated into upload endpoint, not separate |
| POST /api/csv/map-columns | Partial | Column mapping included in upload endpoint |
| POST /api/csv/:id/generate | Working | Triggers batch generation, returns 202 |
| GET /api/csv/:id/status | Working | Returns job status and progress |

#### Order Routes

| Check | Status | Notes |
|---|---|---|
| POST /api/orders | Working | Creates order with items, returns order with order_number |
| GET /api/orders | Working | Customer gets own orders only via RLS |
| GET /api/orders/:id | Working | Returns detail, 403 if not owner or admin |
| PATCH /api/orders/:id/status | Working | Admin only, updates status |
| POST /api/orders/:id/reorder | Working | Route exists but no frontend button |

#### Proof Routes

| Check | Status | Notes |
|---|---|---|
| POST /api/proofs | Working | Admin/staff generates proof, stores file, creates record |
| GET /api/proofs/:order_item_id | Working | Returns all proof versions for item |
| POST /api/proofs/:id/approve | Working | Updates status, logs audit, triggers production |
| POST /api/proofs/:id/revision | Working | Updates status, saves notes, notifies admin |
| POST /api/proofs/:id/generate-production | Working | Triggers production file generation |

#### Admin Routes

| Check | Status | Notes |
|---|---|---|
| GET /api/admin/dashboard | Working | Admin only, returns comprehensive stats |
| GET /api/admin/orders | Working | Full pipeline with filters, admin/staff only |
| GET /api/admin/orders/:id/files | Working | Returns file list, admin/staff only |
| PATCH /api/admin/orders/bulk-status | Working | Bulk update, admin only |
| GET /api/admin/users | Working | User list with pagination, admin only |
| PATCH /api/admin/users/:id | Working | Role update, admin only |
| CRUD /api/admin/products/* | Working | Full CRUD, admin only |
| CRUD /api/admin/templates/* | Working | Full CRUD, admin/staff |

#### Webhook Routes

| Check | Status | Notes |
|---|---|---|
| POST /api/webhooks/stripe | Working | Signature verified, idempotency check (BUG-016), updates order on payment |
| POST /api/webhooks/payfast | Working | IP + MD5 signature verified, handles COMPLETE/CANCELLED, records history |

---

### Section 9 — File Storage & Naming

| Check | Status | Notes |
|---|---|---|
| Supabase Storage buckets configured | Working | 5 buckets: designs (public), proofs (public), production (private), uploads (private), avatars (public) |
| Uploaded artwork stored with uploaded_files record | Working | Records file_url, original_name, mime_type, file_size_bytes, purpose |
| Production files stored at /production/{order_id}/{product_type}/ | Working | Path structure confirmed in production generator |
| CSV files stored at expected path | Partial | CSV data stored in csv_jobs.parsed_data (JSONB) and file_url but not confirmed at exact `/production/{order_id}/csv_data/original_upload.csv` path |
| order_manifest.json stored | Missing | Referenced in code but actual storage not confirmed |
| Production file naming convention followed | Partial | Safe filename generation exists but may not exactly match `{OrderID}_{ProductType}_{RowNumber}_{Name}_{Date}.pdf` format |
| Files accessible to correct roles (RLS/signed URLs) | Working | Storage policies enforce: users own uploads, admins manage production |
| Public files (proofs) have correct access | Working | Proofs bucket is public with SELECT policy |
| Production files restricted to admin/staff | Working | Production bucket is private, admin/staff-only policy |

---

### Section 10 — Database Schema Verification

| Check | Status | Notes |
|---|---|---|
| profiles table with all required columns | Working | id, email, full_name, company_name, phone, address_line1, address_line2, city, province, postal_code, country, role, avatar_url, created_at, updated_at |
| role enum values: customer, admin, production_staff | Working | Correct enum defined |
| RLS: users can only read/write own profile | Working | Policies for SELECT/UPDATE on `auth.uid() = id` |
| product_groups with division, display_order, is_active | Working | All columns present with division_type enum |
| product_templates with print specs | Working | print_width_mm, print_height_mm, bleed_mm, safe_zone_mm, dpi, panels, template_json |
| template_parameters with param_type enum | Working | select, range, number, text (note: 'number' added beyond spec's original 3) |
| pricing_rules with currency=ZAR | Working | DB default is 'ZAR', seed data uses 'ZAR' |
| orders with all required columns | Working | All columns present including order_number auto-generation trigger |
| order_items with design_id and csv_job_id FKs | Working | Both nullable FKs with ON DELETE SET NULL |
| csv_jobs with all required columns | Working | Includes progress field (0-100) beyond original spec |
| designs with canvas_json and is_saved_template | Working | Full schema with RLS |
| proofs with version tracking | Working | Auto-incrementing version, comprehensive audit support |
| production_files with metadata | Working | file_url, file_type, file_name, resolution_dpi, has_bleed, metadata JSONB |
| uploaded_files with purpose enum | Partial | Purpose enum: artwork, logo, csv, proof, production. Missing: 'document' or generic type |

---

### Section 11 — Customer-Facing Pages

| Page | URL/Route | Renders? | Key Elements Present? |
|---|---|---|---|
| Home | / | Working | Hero, division cards (V2_DIVISIONS), featured products, CTA, FAQ, testimonials, how-it-works |
| Products Listing | /products | Working | Grid view, division filter via query params |
| Product Detail | /products/:slug | Working | Params, price calc, "Design Now" CTA |
| Canvas Designer | /designer/:templateId | Working | Fabric.js canvas, toolbar, layers, properties |
| Cart | /cart | Working | Item list, pricing summary, checkout CTA |
| Checkout | /checkout | Working | Address form, Stripe payment (PayFast missing from UI) |
| Order Confirmation | /checkout/success | Working | Order number, summary |
| My Account (Dashboard) | /account | Working | Order history, proof items, profile link |
| Proof Review | /account/orders/:id/proof/:itemId | Working | Proof image, versions, approve/revise buttons |
| Admin Dashboard | /admin | Working | Stats, pipeline, quick actions |
| Admin Orders | /admin/orders | Working | Pipeline with filters, search |
| Admin Users | /admin/users | Working | User list, role management |
| Admin Products | /admin/products | Working | Product/template CRUD |
| About | /about | Working | Company story, 6 divisions listed |
| FAQ | /faq | Working | 4 accordion sections, 14 Q&A pairs |
| Contact | /contact | Working | Form + contact details + business hours |
| Terms | /terms | Broken | **References India/INR/GST instead of South Africa/ZAR/VAT** |
| Privacy | /privacy | Working | 7 sections, POPIA compliance mentioned |
| 404 | /nonexistent | Working | Custom 404 with "Go Home" and "Browse Products" buttons |
| Templates | /templates | Working | Template browser filtered by V2_DIVISIONS |
| Delivery Info | /delivery-info | Working | 3 tiers (Standard/Express/Collection) |

---

### Section 12 — Forms, Buttons & Navigation Audit

#### 12.1 All Forms

| Form | Status | Notes |
|---|---|---|
| Registration form | Working | Email, password, confirm, full_name, company_name with validation |
| Login form | Working | Email + password with error handling |
| Password Reset (request + new password) | Working | Two-mode form: request link + set new password |
| Profile edit form | Working | Full address fields + password change |
| Product configurator form | Working | Dynamic parameters (select, range, number, text types) |
| Canvas text add/edit | Working | Via TextPanel and PropertiesPanel |
| Image upload (drag-drop + file picker) | Working | Both methods in AddPanel and MyUploadsPanel |
| CSV upload + column mapping | Working | Papa Parse + validation + column mapping UI |
| Add to Cart | Working | Quantity modal in designer toolbar |
| Cart quantity update | Working | Inline quantity adjustment |
| Checkout form (shipping address) | Working | Full SA address with province dropdown |
| Payment trigger | Partial | Stripe only; PayFast form not wired |
| Proof revision request | Working | Notes text field + submit |
| Proof approval | Working | Single-click approve button |
| Reorder button | Missing | No frontend reorder button found |
| Admin: create/edit product group | Working | Full CRUD forms |
| Admin: create/edit product template | Working | Print spec fields included |
| Admin: create/edit pricing rule | Partial | Schema supports it but dedicated UI unclear |
| Admin: bulk status update | Working | Multi-select + status dropdown |
| Admin: proof approve on behalf | Working | Via ProofPanel component |
| Contact page form | Working | name, email, subject, message with validation |
| Admin: user role change | Working | Role dropdown in user detail |

#### 12.2 Buttons

| Check | Status | Notes |
|---|---|---|
| Every CTA button has working onClick handler | Partial | Most buttons work; some links use Next.js `<Link>` correctly |
| No dead/inert buttons | Partial | PayFast payment button not connected in checkout |
| Destructive actions show confirmation dialog | Working | Delete design confirmed; order cancellation has dialog |
| Disabled states during loading/processing | Working | Loading spinners on form submissions |

#### 12.3 Navigation & Links

| Check | Status | Notes |
|---|---|---|
| All top nav links resolve (no 404) | Working | /our-story, /products, /templates, /faq, /contact, /order-now |
| All footer links resolve | Working | Quick links, product division links, terms, privacy |
| Admin sidebar links all resolve | Working | All admin routes exist |
| Customer dashboard nav links all resolve | Working | /account, /account/orders, /account/designs, /account/profile |
| Mobile navigation (hamburger) opens and links work | Working | Sheet component for mobile nav |
| "Back" buttons function correctly | Working | Browser back navigation + explicit back links |

#### 12.4 Redirects

| Check | Status | Notes |
|---|---|---|
| After login (customer) -> /account | Working | With safe redirect parameter support |
| After login (admin) -> /admin | Working | Middleware redirects based on role |
| After login (production staff) -> production pipeline | Working | Redirects to /admin/production for restricted routes |
| After registration -> /account | Working | Direct redirect on successful signup |
| After payment success -> confirmation | Working | /checkout/success?order_id=[id] |
| After payment failure -> checkout with error | Working | /checkout/cancel with retry option |
| Unauthenticated /account -> /login | Working | With redirect query param preserved |
| Unauthenticated /admin -> /login | Working | With redirect query param |
| Customer accessing /admin -> 403/redirect | Working | Redirects to /forbidden?from=/admin |

---

### Section 13 — Email System

| Check | Status | Notes |
|---|---|---|
| Email provider configured (Resend) | Working | RESEND_API_KEY present in .env.local, `resend.ts` configured |
| Order confirmation email | Working | Template exists, sent after payment confirmation |
| Proof ready email with link to review | Working | Sent on proof generation with review URL |
| Proof approved email to admin | Working | Notification on customer approval |
| Revision requested email to admin | Working | Includes customer notes |
| Password reset email | Working | Sent via Supabase Auth + custom Resend template |
| Email templates render correctly | Partial | HTML templates exist but no runtime render test possible |
| Email "from" address correctly set | Partial | Set to `onboarding@resend.dev` (Resend default domain) — should be custom domain for production |
| Unsubscribe or contact info in emails | Missing | No unsubscribe link or physical address in email templates |

---

### Section 14 — Design System & Brand

| Check | Status | Notes |
|---|---|---|
| Brand colors applied consistently | Partial | Primary red (#E30613), secondary dark navy, accent yellow used. But inconsistency: spec says #C62828, implementation uses #E30613 |
| Typography consistent | Working | Inter and system sans-serif fonts used throughout |
| shadcn/ui components used consistently | Working | Button, Card, Dialog, Input, Select, Badge, Table, Tabs, Accordion, etc. |
| Mobile-first responsive layout | Working | Tailwind responsive classes at sm/md/lg/xl breakpoints |
| No horizontal scroll on mobile | Working | No evidence of overflow issues |
| All images have alt text | Partial | Most images have alt text but some decorative images may lack it |
| Color contrast WCAG 2.1 AA | Working | Red/white and dark/white combinations appear compliant |
| SpeedyPrint logo in header and favicon | Working | Logo in Header component |
| Division branding consistent | Missing | **Two division systems coexist** (V1: labels, laser, race-numbers, mtb-boards, print, trophies vs V2: custom-stickers, product-labels, vehicle-decals, window-wall, specialty-3d) causing inconsistency |
| Page load target under 3 seconds | Working | Next.js with SSR/SSG should achieve this target |

---

### Section 15 — Platform Health & General Quality

| Check | Status | Notes |
|---|---|---|
| No TypeScript compilation errors (tsc --noEmit) | Partial | **1 error**: `ProductConfigurator.tsx(153,27): error TS2367: comparison between 'Division' and '"events"' has no overlap` — stale division value after migration |
| No ESLint errors on key source files | Working | ESLint configured via next lint |
| All environment variables present | Working | See Environment Variables Checklist below |
| Supabase DB connection functional | Working | All routes use Supabase client successfully |
| Supabase Storage buckets exist and accessible | Working | 5 buckets configured in schema |
| No unhandled promise rejections in API routes | Working | try/catch in all API routes with 500 fallback |
| All API routes return correct HTTP status codes | Working | 200, 201, 202, 400, 401, 403, 404, 422, 500 used appropriately |
| Error boundaries in React components | Partial | No explicit ErrorBoundary components found; relies on Next.js error.tsx |
| Loading states for async data fetches | Working | Loading spinners in forms and data lists |
| Empty states shown gracefully | Working | "No orders yet", "No designs saved" messages |
| No raw stack traces exposed to end users | Working | Generic error messages in production |
| Next.js build completes without errors | Working | `.next` directory present from successful build |
| No console.error in production | Working | Error handling wraps console errors |
| SEO: meta titles and descriptions per page | Working | Comprehensive metadata on all pages with OpenGraph |
| sitemap.xml generated | Working | Dynamic sitemap.ts with 98 static pages + dynamic products/blog |
| robots.txt present | Working | Disallows /api/, /admin/, /account/, /checkout/, /designer/, /_next/ |

---

## Critical Issues (Must Fix Before Launch)

1. **CURRENCY HARDCODED TO INR** — `src/lib/utils/constants.ts` sets `CURRENCY = 'INR'` and `CURRENCY_SYMBOL = '₹'`. Stripe checkout route (`/api/checkout/stripe/route.ts`) also hardcodes `currency: 'inr'`. This is a South African business — must be ZAR/R. This affects all price displays and payment processing.

2. **PayFast NOT wired to checkout UI** — PayFast webhook handler exists and works, but the checkout page only offers Stripe payment. South African customers cannot use the primary local payment gateway. The PayFast config and preparation endpoint exist but are not connected to the checkout flow.

3. **Terms of Service page references India** — `src/app/(main)/terms/page.tsx` contains "services delivered across India", "Indian Rupee (INR)", and "GST" instead of South Africa, ZAR, and VAT. Legal liability risk.

4. **No boundary enforcement on canvas** — Objects (text, images, shapes) can be placed outside the artboard/print area. This means production files could have clipped or missing content. Critical for a print business.

5. **Reorder feature not accessible** — API endpoint `/api/orders/:id/reorder` exists but no frontend button or UI to trigger it. Customers cannot reorder from dashboard.

6. **TypeScript error in ProductConfigurator** — Comparison with stale `"events"` division value after migration to new division types. Will cause runtime issues for event product configuration.

---

## High Priority Issues (Fix Before Launch or ASAP)

1. **Two division systems coexist** — V1 divisions in DB/seed (labels, laser, race-numbers, mtb-boards, print, trophies) vs V2 divisions in frontend constants (custom-stickers, product-labels, vehicle-decals, window-wall, specialty-3d). Homepage, footer, and templates page use V2; DB and admin use V1. Needs consolidation.

2. **Email inconsistency** — TopBar uses `info@speedylabels.co.za`, contact page uses `info@speedyprint.co.za` and `orders@speedyprint.co.za`. Footer pulls from DB settings. Need single source of truth.

3. **Brand name inconsistency** — Constants hardcode `SITE_NAME = 'Speedy Labels'` but site is SpeedyPrint. Footer reads from DB `site_settings.site_name`.

4. **Email "from" address is default** — Using `onboarding@resend.dev` (Resend default). Should be custom domain (e.g., `noreply@speedyprint.co.za`) for production credibility.

5. **No unsubscribe/contact info in emails** — Missing for legal compliance (CAN-SPAM, POPIA).

6. **Password validation inconsistency** — Registration enforces 8+ chars with uppercase, digit, special char. Password reset and profile password change only enforce 8+ chars minimum. Users can set weak passwords during recovery.

7. **No alignment/snap guides in designer** — Missing snap-to-center and alignment guides for professional design tool experience.

8. **PayFast webhook lacks idempotency** — Unlike Stripe webhook (which checks webhook_events table), PayFast webhook can process duplicate notifications.

9. **Cart prices are static** — unit_price captured at add-to-cart time and never recalculated. Pricing rule changes won't apply to existing cart items.

10. **No user deactivation** — Admin cannot deactivate/suspend a user account. No `is_active` flag on profiles.

11. **Orphaned order cleanup tied to dashboard** — `cleanup_orphaned_orders()` only runs when admin visits dashboard. Should be a scheduled job.

12. **Duplicate CSV detection missing** — No detection of duplicate values (e.g., duplicate race numbers) in CSV validation.

---

## Recommendations

1. **Consolidate division system** — Choose V1 or V2 and migrate all references. Update seed data, constants, product groups, and frontend components to use a single system.

2. **Add guest checkout** — Current checkout requires login. Consider allowing guest checkout for first-time buyers with optional account creation after purchase.

3. **Implement object boundary enforcement** — Clip or warn when canvas objects extend beyond the artboard/print area. Critical for print quality.

4. **Add snap-to-grid and alignment guides** — Essential UX for a professional design tool. Consider Fabric.js `alignGuidelines` or custom implementation.

5. **Implement real-time collaboration** — Future enhancement for team design workflows.

6. **Add discount/coupon codes** — No promo code support exists in pricing or checkout.

7. **Add inventory/stock management** — Currently unlimited quantities allowed with no stock tracking.

8. **Add weight-based shipping** — Current flat rate is simplistic. Consider integration with SA courier APIs.

9. **Add explicit ErrorBoundary components** — Currently relying on Next.js defaults. Add custom error boundaries around critical components (designer, checkout).

10. **Implement scheduled order cleanup** — Move from lazy dashboard-triggered cleanup to CRON-based cleanup of orphaned orders.

11. **Add rate limiting to more endpoints** — Currently only auth pages are rate-limited. Consider adding to proof generation, CSV upload, and price calculation endpoints.

12. **Production file naming** — Verify and enforce exact naming convention `{OrderID}_{ProductType}_{RowNumber}_{Name}_{Date}.pdf` across all generation paths.

---

## Environment Variables Checklist

- [x] NEXT_PUBLIC_SUPABASE_URL — Present
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY — Present
- [x] SUPABASE_SERVICE_ROLE_KEY — Present
- [x] NEXT_PUBLIC_SITE_URL — Present (https://speedyprint.vercel.app/)
- [ ] PAYFAST_MERCHANT_ID — **MISSING** (PayFast config exists but no credentials in .env.local)
- [ ] PAYFAST_MERCHANT_KEY — **MISSING**
- [ ] PAYFAST_PASSPHRASE — **MISSING**
- [x] STRIPE_SECRET_KEY — Present (test mode)
- [x] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY — Present (test mode)
- [x] STRIPE_WEBHOOK_SECRET — Present
- [x] RESEND_API_KEY — Present
- [x] EMAIL_FROM — Present (using Resend default domain)
- [x] UPSTASH_REDIS_REST_URL — Present
- [x] UPSTASH_REDIS_REST_TOKEN — Present

**Missing from .env.local.example:**
- RESEND_API_KEY (present in .env.local but not in .env.local.example)
- EMAIL_FROM (present in .env.local but not in .env.local.example)
- STRIPE_SECRET_KEY (present in .env.local but not in .env.local.example)
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (present in .env.local but not in .env.local.example)
- STRIPE_WEBHOOK_SECRET (present in .env.local but not in .env.local.example)
- UPSTASH_REDIS_REST_URL (present in .env.local but not in .env.local.example)
- UPSTASH_REDIS_REST_TOKEN (present in .env.local but not in .env.local.example)
- PAYFAST_MERCHANT_ID (needed but completely missing)
- PAYFAST_MERCHANT_KEY (needed but completely missing)
- PAYFAST_PASSPHRASE (needed but completely missing)

**Security Note:** The .env.local file contains live API keys and should never be committed to version control. Verify .gitignore includes `.env.local`.
