The README is quite large (55KB). Let me output the complete content directly for you:

---

# SpeedyPrint

A full-stack e-commerce platform for custom stickers, labels, and decals — built for the South African market. Features an advanced online design wizard with 20+ canvas plugins, dynamic pricing engine, order management pipeline, CSV bulk processing, and integrated PayFast payment processing.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features Overview](#features-overview)
- [Detailed Functionality](#detailed-functionality)
  - [Home Page](#1-home-page)
  - [Product Pages](#2-product-pages)
  - [Design Wizard](#3-design-wizard)
  - [Cart & Checkout](#4-cart--checkout)
  - [Authentication](#5-authentication)
  - [Customer Account](#6-customer-account)
  - [Admin Dashboard](#7-admin-dashboard)
  - [Admin Orders](#8-admin-order-management)
  - [Admin Products](#9-admin-product-management)
  - [Admin Blog](#10-admin-blog-management)
  - [Admin Users](#11-admin-user-management)
  - [Admin Testimonials](#12-admin-testimonials)
  - [Admin Settings](#13-admin-site-settings)
  - [Public Blog](#14-public-blog)
  - [Static Pages](#15-static-pages)
  - [Order Now Quick Form](#16-order-now-quick-form)
- [Design Wizard Plugins](#design-wizard-plugins-full-reference)
- [CSV Bulk Processing](#csv-bulk-processing)
- [Payment Integration (PayFast)](#payment-integration-payfast)
- [Email Notifications](#email-notifications)
- [Pricing Engine](#pricing-engine)
- [Middleware & Route Protection](#middleware--route-protection)
- [User Roles & Permissions](#user-roles--permissions)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Available Scripts](#available-scripts)
- [Security](#security)
- [Theme & Design Tokens](#theme--design-tokens)

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, Radix UI |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (cookie-based SSR sessions) |
| State Management | Zustand (persisted stores) |
| Design Canvas | Fabric.js 7 |
| Payments | PayFast (South African gateway) |
| Email | Resend |
| Validation | Zod 4 |
| Icons | Lucide React |
| PDF Generation | pdf-lib |
| QR Code | qrcode |
| Barcode | jsbarcode |
| CSV Processing | PapaParse, JSZip |
| Notifications | Sonner (toast) |
| Theme | next-themes |

---

## Features Overview

| Area | Key Features |
|------|-------------|
| Storefront | Product catalog, 5 product divisions, live pricing calculator |
| Design Wizard | Full Fabric.js canvas editor with 20+ plugins, text, images, shapes, QR codes, barcodes |
| E-Commerce | Cart, checkout, PayFast payment, order tracking |
| Bulk Orders | CSV upload, variable data mapping, batch PDF generation |
| Admin | Dashboard stats, order pipeline, product CRUD, blog, user management, testimonials, site settings |
| Accounts | Order history, saved designs, profile management, proof review |
| Content | Blog, testimonials, FAQ, contact form, about, privacy, terms |
| Email | 8 transactional email templates via Resend |

---

## Detailed Functionality

### 1. Home Page

**Route:** `/`
**Files:** `src/app/(main)/page.tsx`, `src/components/home/`

#### Hero Section
- Gradient background (brand-secondary to brand-secondary-light)
- Headline: "Premium Custom Stickers, Labels & Decals"
- Quick stats: "5000+ Happy Customers", "24hr Quick Turnaround", "100% Quality Guaranteed"
- Two CTAs: "Order Now" (primary orange button) and "Design Online" (secondary button)

#### Hero Calculator (`HeroCalculator.tsx`)
- Embedded real-time price calculator
- Inputs: Width (mm), Height (mm), Quantity, Material dropdown, 3D Doming checkbox
- Displays live pricing: unit price, subtotal, VAT (15%), total
- Shows "Free delivery included!" when order exceeds R500
- "Order Now" button passes calculator values as URL params to `/order-now`

#### How It Works (`HowItWorks.tsx`)
- 4-step visual process with connector lines:
  1. **Design** (Palette icon) — Create your design online or upload artwork
  2. **Upload** (Upload icon) — Submit your files for review
  3. **We Print** (Printer icon) — Professional production
  4. **We Deliver** (Truck icon) — Fast delivery across South Africa

#### Division Showcase (`DivisionShowcase.tsx`)
- Grid of product categories with hover animation (translate up + shadow)
- Each division card shows: icon, name, description, color scheme
- Divisions: Labels, Laser-cut, Events, Stamps, Sleeves
- Links to `/products?division={key}`

#### Testimonials Carousel (`TestimonialsCarousel.tsx`)
- Fetches featured testimonials from `/api/testimonials?featured=true`
- 3 testimonials visible on desktop, 1 on mobile
- Auto-rotates every 5 seconds (pauses on hover)
- Navigation arrows and dot indicators
- Each card: star rating (1-5), review text (truncated at 150 chars), customer name, company/location

#### CTA Section
- "Ready to get started?" headline
- "Get a Quote" button -> `/order-now`
- "Create Free Account" button -> `/register`

---

### 2. Product Pages

**Route:** `/products` and `/products/[slug]`
**Files:** `src/app/(main)/products/`

#### Product Listing (`/products`)
- Responsive grid: 1 col mobile, 2 tablet, 3-4 desktop
- **Division filter tabs:** "All" + all active divisions fetched from database
- ProductCard for each product: image, name, link to detail page
- Empty state message when no products in selected division
- SEO metadata: custom title, description, OpenGraph tags

#### Product Detail (`/products/[slug]`)
- Breadcrumb navigation
- Division badge with gradient per division type
- Product title, description, and image gallery
- **ProductConfigurator component:**
  - Template selector dropdown (multiple templates per product)
  - Dynamic parameter inputs based on `template_parameters` (sorted by display_order)
  - Parameter types: text inputs, select dropdowns, numeric inputs
  - Real-time price calculation as any parameter changes
  - Quantity selector with +/- buttons
  - Live price display: unit price, subtotal, VAT, total
  - **"Design Now"** button -> opens designer with selected template (with loading spinner)
  - **"Upload Artwork"** button -> opens designer in upload mode (with loading spinner)
  - Both buttons show spinner + loading text until page navigates

---

### 3. Design Wizard

**Route:** `/designer/[templateId]`
**Files:** `src/app/(main)/designer/`, `src/components/designer/`, `src/lib/designer/`

The Design Wizard is a full-featured canvas editor built on Fabric.js with a plugin architecture supporting 20+ plugins.

#### Top Bar (`TopBar.tsx`)
- Design name input (editable, auto-saves)
- Dirty indicator (shows when there are unsaved changes)
- **Save** button (requires login, saves design to Supabase)
- **Preview** button (generates thumbnail)
- **Add to Cart** button (saves design first, then adds to cart)
- Login prompts shown for unauthenticated users

#### Layout
- 3-column layout: **Toolbar** (left) | **Canvas** (center) | **Properties Panel** (right)
- Responsive stacking on mobile devices

#### Designer Canvas (`DesignerCanvas.tsx`)
- Initializes Fabric.js canvas with template dimensions (width_mm, height_mm, DPI)
- Loads Google Fonts for typography
- Drag-and-drop image upload support
- Zoom controls (zoom in/out/fit-to-screen)
- Renders bleed zones, safe zones, and print zones visually
- Multi-select support for objects
- Right-click context menu

#### Toolbar (`Toolbar.tsx`)
Tabbed interface with 6 panels:

| Tab | Panel | Functionality |
|-----|-------|--------------|
| Text | `TextPanel.tsx` | Font family (Google Fonts), size, color/gradient picker, alignment, bold/italic/underline, shadow, letter spacing |
| Images | Image upload | Upload images, import SVG/JSON, drag-and-drop |
| Shapes | `ShapesPanel.tsx` | Rectangle, circle, line, triangle, star, polygon with fill/stroke customization |
| QR/Barcode | `QRCodePanel.tsx`, `BarcodePanel.tsx` | Generate QR codes (text/URL, error correction levels) and barcodes (Code128, EAN-13, UPC-A) |
| Filters | `ImageFiltersPanel.tsx` | Grayscale, sepia, blur, brightness, contrast, saturation on images |
| Layers | `LayersPanel.tsx` | Layer list, visibility toggles, reordering, locking, rename |

#### Properties Panel (`PropertiesPanel.tsx`)
Shows properties of the currently selected object:
- Position: X, Y coordinates
- Size: Width, Height
- Rotation angle
- Fill color (solid or gradient via `ColorPicker` / `GradientPicker`)
- Stroke color and width
- Opacity/transparency slider
- Layer name (editable)
- Lock/unlock toggle
- Delete button
- Object type indicator (text, image, shape, etc.)

#### Export Dialog (`ExportDialog.tsx`)
- Export formats: PNG, JPG, SVG, PDF
- Adjustable quality and resolution
- Export with/without background
- Export with/without guides and zones

#### Color Picker (`ColorPicker.tsx`)
- Solid color selection with hex/RGB input
- Preset color swatches
- Eyedropper tool

#### Gradient Picker (`GradientPicker.tsx`)
- Linear and radial gradients
- Multiple color stops
- Angle control for linear gradients

---

### 4. Cart & Checkout

**Routes:** `/cart` and `/checkout`
**Files:** `src/app/(main)/cart/`, `src/app/(main)/checkout/`

#### Cart Page (`/cart`)
**Layout:** 2-column on desktop, 1-column on mobile

**Left Column — Cart Items:**
- Item thumbnail image (placeholder if unavailable)
- Product name and template name
- Selected parameters as comma-separated list
- Quantity controls (+/- buttons)
- Line total price per item
- Remove item button (X)
- Empty cart state with "Browse Products" CTA

**Right Column — Order Summary (sticky sidebar):**
- Subtotal
- VAT (15%)
- Shipping note (calculated at checkout)
- Total price
- "Proceed to Checkout" button (with loading spinner)
- "Continue Shopping" link

**Cart State (Zustand `useCart` store):**
- Persisted to `localStorage`
- Add/remove/update items
- Automatic tax calculation
- Free shipping threshold tracking (R500)
- Clears on successful checkout

#### Checkout Page (`/checkout`)
**Two-Step Process:**

**Step 1 — Shipping Address:**
- Full Name (required)
- Phone number
- Address Line 1 (required)
- Address Line 2
- City (required)
- Province (dropdown of all 9 SA provinces)
- Postal Code (required)
- Auto-fills from user profile if available
- "Continue to Review" button

**Step 2 — Review & Pay:**
- Order items summary table (item, qty, line total)
- Shipping address display with "Edit Address" link
- Payment notice (PayFast integration)
- "Place Order" button with loading spinner
- Real-time summary sidebar

**Order Creation Flow:**
1. Creates order in database with `pending_payment` status
2. Creates `order_items` for each cart item
3. Redirects to PayFast for payment (or to `/account/orders/{id}`)
4. Clears cart after successful placement
5. Shows success toast notification

---

### 5. Authentication

**Routes:** `/login`, `/register`, `/reset-password`
**Files:** `src/app/(auth)/`, `src/hooks/useAuth.ts`

#### Login Page (`/login`)
- Email and password inputs
- "Forgot password?" link to `/reset-password`
- "Don't have an account?" link to `/register`
- Sign In button with loading spinner + "Signing in..." text
- Redirect parameter support (`?redirect=/path`) for post-login routing
- Defaults to redirecting to `/account` after login
- Error toast notifications on failure

#### Register Page (`/register`)
- Email input
- Password input
- Confirm password validation (must match)
- Full name (optional)
- Company name (optional)
- Terms acceptance checkbox (required)
- "Create Account" button with loading spinner
- Link to login page
- Welcome email sent on successful registration

#### Reset Password Page (`/reset-password`)
- Email input
- "Send Reset Link" button with loading spinner
- Sends password reset email via Supabase Auth
- Confirmation message displayed after sending
- Back to login link

#### Auth Store (`useAuth` hook — Zustand)
- `login(email, password)` — Supabase signInWithPassword
- `register(email, password, metadata)` — Supabase signUp
- `logout()` — Supabase signOut
- `resetPassword(email)` — Supabase resetPasswordForEmail
- Tracks `isLoading`, `user`, `profile` state
- Session persistence via Supabase SSR cookies

---

### 6. Customer Account

**Route:** `/account/*`
**Files:** `src/app/(main)/account/`

#### Account Dashboard (`/account`)
**Quick Stats Cards:**
- Total Orders count
- Saved Designs count
- Member Since date

**Recent Orders Section:**
- Last 5 orders in table format
- Columns: Order number, date, total, status
- Color-coded status badges
- "View All" link to `/account/orders`

**Saved Designs Section:**
- Grid of design thumbnails (3 columns)
- Thumbnail image or design name placeholder
- Hover overlay with design name
- Click to load design in the designer

#### Orders List (`/account/orders`)
- Full table of all user orders
- Columns: Order #, Date, Total, Status, Items count, Actions
- Clickable rows to view order detail
- Pagination support
- Status filter

#### Order Detail (`/account/orders/[id]`)
- Order number and current status badge
- Items list with quantities and prices
- Shipping and billing addresses
- Order timeline (status history with timestamps)
- Payment details (if paid)
- Proof review section (if proofs available)
- Tracking information (when shipped)

#### Proof Review (`/account/orders/[id]/proof/[itemId]`)
- Displays proof image/PDF for the order item
- **"Approve Proof"** button — marks item as approved for production
- **"Request Revision"** button — opens textarea for revision notes
- Revision notes saved to order and sent to admin via email
- Approval triggers production file generation workflow

#### Saved Designs (`/account/designs`)
- Grid gallery of all saved designs
- Thumbnail preview and design name
- Click to re-open in designer
- Delete design button with confirmation
- Search/filter by name
- Pagination for large collections

#### Profile Page (`/account/profile`)
- Full name input
- Email display (read-only)
- Company name
- Phone number
- Address fields: Line 1, Line 2, City, Province (dropdown), Postal Code
- "Save Changes" button with loading spinner + "Saving..." text

---

### 7. Admin Dashboard

**Route:** `/admin`
**Files:** `src/app/admin/page.tsx`, `src/components/admin/DashboardStats.tsx`

#### Dashboard Statistics Cards
| Metric | Description |
|--------|-------------|
| Total Orders | Count of all orders in the system |
| Total Revenue | Sum of all paid order totals (in ZAR) |
| This Month Revenue | Revenue from current calendar month |
| Pending Orders | Orders not yet completed/delivered |
| Active Users | Users with recent account activity |
| Average Order Value | Mean order total across all orders |

#### Recent Orders Table
- Last 5-10 orders
- Columns: Order #, Customer name/company, Date, Total, Status
- Click row to view full order details
- "View All" link to `/admin/orders`

#### Quick Action Buttons
- View Orders -> `/admin/orders`
- Manage Products -> `/admin/products`
- View Users -> `/admin/users`

---

### 8. Admin Order Management

**Route:** `/admin/orders` and `/admin/orders/[id]`
**Files:** `src/app/admin/orders/`, `src/components/admin/OrderPipeline.tsx`

#### Order Pipeline (`/admin/orders`)

**Search & Filters:**
- Search by order number or customer name
- Status dropdown filter
- Date range filter (from date / to date)

**Bulk Actions:**
- Checkbox selection per row + "select all" header checkbox
- Bulk status update dropdown
- "Apply" button to update all selected orders at once

**Orders Table:**
| Column | Content |
|--------|---------|
| Checkbox | Select for bulk action |
| Order # | Unique order identifier |
| Customer | Name and company |
| Date | Order creation date |
| Items | Number of line items |
| Total | Order total in ZAR |
| Status | Color-coded badge |
| Actions | View detail link |

**Pagination:** Configurable per-page limit with previous/next navigation

#### Order Status Flow
```
pending_payment -> pending_design -> proof_pending_review -> approved_for_production -> in_production -> ready_to_ship -> shipped -> delivered
                                                                                                                              \-> cancelled (from any status)
```

#### Order Detail (`/admin/orders/[id]`)
- Order header: number, date, customer info
- Items table: product, template, qty, unit price, line total
- Shipping address display
- Billing address display
- Payment information (method, reference, date)
- Proof images/documents viewer
- Order timeline with status history (timestamps and notes)
- **Actions:**
  - Change status (dropdown with all valid transitions)
  - Upload/send proof to customer
  - Download production files
  - Send email to customer
  - Add internal notes
  - View associated designs

---

### 9. Admin Product Management

**Route:** `/admin/products`, `/admin/products/new`, `/admin/products/[id]/edit`
**Files:** `src/app/admin/products/`

#### Product List (`/admin/products`)
- Division filter tabs: All, Labels, Laser, Events, Stamps, Sleeves
- Products table:
  - Product image thumbnail
  - Product name and slug
  - Division badge
  - Template count
  - Display order number
  - Active/Inactive status badge
  - Edit and Delete action buttons
- "Add Product" button -> `/admin/products/new`

#### Create Product (`/admin/products/new`)
**Form fields:**
- Product name (required)
- Slug (auto-generated from name, editable)
- Description (textarea)
- Division (select dropdown)
- Image upload or URL
- Display order (number)
- Is Active toggle
- "Create Product" button with loading spinner

#### Edit Product (`/admin/products/[id]/edit`)
**Product Details Tab:**
- All fields from create form, pre-populated
- "Save Product" button with loading spinner

**Templates Tab:**
- List of associated `product_templates`
- Add new template button
- Per-template fields:
  - Template name
  - Print dimensions: width_mm, height_mm
  - DPI (300, 600, etc.)
  - Bleed (mm)
  - Safe zone (mm)
  - Template parameters configuration
- "Save Template" button with loading spinner per template
- Delete template button

**Pricing Rules Tab:**
- Table of existing pricing rules with conditions
- Add new pricing rule button
- Per-rule fields:
  - Rule type (base price, quantity tier, material modifier, etc.)
  - Conditions and values
- "Save Rule" button with loading spinner per rule
- Delete rule button

---

### 10. Admin Blog Management

**Route:** `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]/edit`
**Files:** `src/app/admin/blog/`

#### Blog Posts List (`/admin/blog`)
- Table columns: Title, Author, Date, Status (Draft/Published), Views count, Actions
- Edit button -> `/admin/blog/{id}/edit`
- Delete button with confirmation
- Publish/unpublish toggle
- Featured toggle
- "Create Post" button -> `/admin/blog/new`

#### Create/Edit Post (`/admin/blog/new`, `/admin/blog/[id]/edit`)
**Form fields:**
- Title (required)
- Slug (auto-generated from title)
- Featured image upload
- Content (rich text editor)
- Excerpt/summary
- Author name
- Category tags
- SEO title (for meta tag)
- Meta description (for meta tag)
- Published checkbox
- Featured checkbox
- Publish date picker
- "Create Post" / "Save Changes" button with loading spinner

---

### 11. Admin User Management

**Route:** `/admin/users` and `/admin/users/[id]`
**Files:** `src/app/admin/users/`

#### User List (`/admin/users`)
**Filters:**
- Search by name, email, or company
- Role filter dropdown: All, Customer, Admin, Production Staff

**Users Table:**
| Column | Content |
|--------|---------|
| Avatar | User initials in circle |
| Full Name | User's display name |
| Email | Email address |
| Company | Company name (if set) |
| Phone | Phone number |
| Role | Color-coded badge (customer/admin/production_staff) |
| Member Since | Registration date |
| Order Count | Total orders placed |
| Actions | View detail link |

**Pagination:** 20 users per page with previous/next navigation

#### User Detail (`/admin/users/[id]`)
- Full user profile information
- Edit role (dropdown to change role)
- View order history for this user
- View saved designs
- Account status (active/disabled)
- Last active date
- Disable/enable account toggle

---

### 12. Admin Testimonials

**Route:** `/admin/testimonials`
**Files:** `src/app/admin/testimonials/`

#### Testimonials Management
**Table columns:**
- Customer name
- Company
- Rating (1-5 stars visual)
- Review text excerpt
- Featured status badge
- Published status badge
- Date added

**Actions per row:**
- Edit testimonial
- Delete testimonial (with confirmation)
- Toggle featured on/off
- Toggle published on/off

**Create/Edit Form:**
- Customer name (required)
- Company name
- Location
- Rating (1-5 star selector)
- Review text (required, textarea)
- Image upload
- Featured checkbox
- Published checkbox

---

### 13. Admin Site Settings

**Route:** `/admin/settings`
**Files:** `src/app/admin/settings/`

#### Settings Form (key-value pairs stored in `site_settings` table)

**Business Information:**
- Site name
- Site tagline
- Company address
- Company phone
- Company email

**WhatsApp Integration:**
- WhatsApp number (international format, no + prefix)
- Live preview link

**Tax & Shipping:**
- VAT rate (decimal, e.g., 0.15 for 15%)
- Free delivery threshold (order amount in ZAR)
- Flat shipping rate (ZAR)

**Social Media:**
- Facebook URL
- Instagram URL
- Twitter/X URL

**Branding:**
- Logo URL

**Currency (read-only display):**
- South African Rand (R / ZAR)

"Save All" button with loading state

---

### 14. Public Blog

**Route:** `/blog` and `/blog/[slug]`
**Files:** `src/app/(main)/blog/`

#### Blog Index (`/blog`)
- Hero section with title and description
- Blog posts grid (3 columns desktop, 1 mobile)
- Each post card: featured image, title, excerpt, author, date, "Read more" link
- Only published posts shown

#### Blog Post Detail (`/blog/[slug]`)
- Full article content rendered
- Featured image header
- Author name and published date
- Reading time estimate
- Share buttons (social media)
- Related posts section
- Back to blog link
- SEO metadata (title, description, OpenGraph)

---

### 15. Static Pages

| Page | Route | Content |
|------|-------|---------|
| About | `/about` | Company story, mission, team, USPs |
| Our Story | `/our-story` | Company history, timeline, milestones, vision |
| Contact | `/contact` | Contact form (name, email, subject, message) + business contact info + WhatsApp widget |
| FAQ | `/faq` | Accordion Q&A sections, searchable, contact CTA |
| Privacy Policy | `/privacy` | Data handling, POPIA compliance |
| Terms of Service | `/terms` | Terms, liability, dispute resolution |
| Delivery Info | `/delivery-info` | Delivery areas (SA provinces), times, costs, tracking |
| Why Choose Us | `/why-choose-us` | Key benefits, quality, turnaround, support, pricing |
| Testimonials | `/testimonials` | Featured testimonials gallery with ratings |
| Templates | `/templates` | Template gallery by category, preview, use in designer |

---

### 16. Order Now Quick Form

**Route:** `/order-now`
**Files:** `src/app/(main)/order-now/page.tsx`, `src/components/order/QuickOrderForm.tsx`

**Layout:** 2-column (form left, price summary right)

**Configuration Form:**
- **Size:** Width (mm) and Height (mm) inputs (range: 10-2000mm)
- **Quantity:** Number input (range: 1-100,000), shows "Volume discount applied!" at 50+
- **Material / Vinyl:** White Vinyl, Clear, Chrome, Reflective, Holographic (with % surcharge shown)
- **Finish:** Gloss, Matte, Satin
- **Adhesion:** Standard, High-Tack, Removable
- **Shape:** Standard (Rect/Round), Die-Cut, Kiss-Cut
- **3D Doming:** Checkbox toggle (+R3.50/unit surcharge)
- **Artwork Upload:** Drag-and-drop or click, accepts PNG/JPEG/SVG up to 50MB, shows preview with remove button

**Price Summary Sidebar (sticky):**
- Size display
- Quantity display
- Unit price
- Subtotal
- VAT (15%)
- Delivery status (FREE if over R500)
- **Total** (large, prominent)
- **"Add to Cart"** button with loading spinner + "Adding to Cart..." text
- **"Design Online Instead"** button -> `/templates`

**URL Parameters:** Accepts `?w=&h=&q=&m=&d=` to pre-populate form from hero calculator

---

## Design Wizard Plugins (Full Reference)

The designer uses a plugin architecture where all plugins extend a base class and register with the Editor singleton.

| # | Plugin | File | Functionality | Keyboard Shortcut |
|---|--------|------|---------------|-------------------|
| 1 | **AlignPlugin** | `AlignPlugin.ts` | Align objects: left, center, right, top, middle, bottom. Distribute evenly. Match dimensions. | Alt+L/C/R |
| 2 | **BarcodePlugin** | `BarcodePlugin.ts` | Generate barcodes (Code128, EAN-13, UPC-A). Adjustable size, thickness, color. | — |
| 3 | **ContextMenuPlugin** | `ContextMenuPlugin.ts` | Right-click menu: Cut, Copy, Paste, Duplicate, Delete, Group, Align, Flip. Object-specific options. | Right-click |
| 4 | **CopyPastePlugin** | `CopyPastePlugin.ts` | Copy/paste selected objects with slight offset. Delete selected. | Ctrl+C, Ctrl+V, Delete |
| 5 | **ExportPlugin** | `ExportPlugin.ts` | Export canvas as PNG, JPG, SVG, PDF. Adjustable quality/resolution. With/without background & guides. | — |
| 6 | **FlipPlugin** | `FlipPlugin.ts` | Flip objects horizontally or vertically. | H, V |
| 7 | **GridPlugin** | `GridPlugin.ts` | Toggle grid overlay. Adjustable grid size and color. Snap-to-grid toggle. | — |
| 8 | **GroupPlugin** | `GroupPlugin.ts` | Group/ungroup selected objects. Edit group contents. | Ctrl+G, Ctrl+Shift+G |
| 9 | **GuidelinePlugin** | `GuidelinePlugin.ts` | Smart alignment guides when dragging. Distance indicators. Color-coded snap lines. | — |
| 10 | **HistoryPlugin** | `HistoryPlugin.ts` | Full undo/redo with state snapshots. Max 50 history states. | Ctrl+Z, Ctrl+Y |
| 11 | **ImagePlugin** | `ImagePlugin.ts` | Image upload/drag-drop. Crop tool. Filters: grayscale, sepia, blur, brightness, contrast, saturation. | — |
| 12 | **ImportPlugin** | `ImportPlugin.ts` | Import SVG, JSON design files, or from URL. Parse and render to canvas. | — |
| 13 | **KeyboardPlugin** | `KeyboardPlugin.ts` | Central keyboard shortcuts manager. Arrow keys to nudge objects. | Various |
| 14 | **QRCodePlugin** | `QRCodePlugin.ts` | Generate QR codes from text/URL. Error correction levels (L/M/Q/H). Adjustable size and colors. | — |
| 15 | **RulerPlugin** | `RulerPlugin.ts` | Display rulers on top and left edges. Pixel/mm/inch units. Color-coded zone indicators. | — |
| 16 | **ShapePlugin** | `ShapePlugin.ts` | Shapes: Rectangle, Circle, Line, Triangle, Star, Polygon. Customizable fill, stroke, corner radius. | — |
| 17 | **SnapPlugin** | `SnapPlugin.ts` | Snap to grid and other objects (center/edges). Configurable snap distance. Visual feedback. | — |
| 18 | **TextPlugin** | `TextPlugin.ts` | Full typography: Google Fonts, size, bold/italic/underline, color, alignment, line height, letter spacing, shadow. | — |
| 19 | **WatermarkPlugin** | `WatermarkPlugin.ts` | Add watermark text. Adjustable opacity, angle, scale. Behind or in front of content. Disabled on export. | — |
| 20 | **ZonePlugin** | `ZonePlugin.ts` | Initialize bleed, safe, and print zones from template. Visual rendering of zone boundaries. | — |
| 21 | **ZoomPlugin** | `ZoomPlugin.ts` | Zoom levels: 25%-200%. Fit to screen. Keyboard and scroll wheel zoom. | +/-, Ctrl+Scroll |

---

## CSV Bulk Processing

**Route:** `/designer/[templateId]/csv`
**Files:** `src/lib/csv/variable-renderer.ts`, `src/app/api/csv/`

### Complete Workflow

**Step 1 — File Upload:**
- Drag-and-drop or click to select CSV file
- Only `.csv` format accepted
- Parsed with PapaParse library

**Step 2 — Column Mapping:**
- CSV headers displayed alongside template parameter dropdowns
- Auto-maps columns if column names match parameter keys
- Preview of first 10 data rows
- Row count and column count statistics shown

**Step 3 — Validation:**
- Required fields must be populated
- Duplicate detection in identifier column
- Data type validation against parameter types
- Detailed error list with row numbers
- Max 5,000 rows per job

**Step 4 — Batch Generation:**
- `POST /api/csv/upload` — Creates job with validated data
- `POST /api/csv/{id}/generate` — Triggers batch processing
- Backend generates individual production files per row
- Variable data substituted into template design

**Step 5 — Progress Tracking:**
- Polling endpoint: `GET /api/csv/{id}/status` (every 2 seconds)
- Returns progress percentage (0-100%)
- Completed and failed row counts
- Error log for failed rows
- Download link for generated files (ZIP via JSZip)

---

## Payment Integration (PayFast)

**Files:** `src/lib/payfast/config.ts`, `src/app/api/webhooks/payfast/route.ts`, `src/app/api/checkout/route.ts`

### Configuration
- Merchant ID and Key from environment variables
- Passphrase for MD5 signature generation
- Sandbox mode toggle for development/testing
- 19 whitelisted PayFast server IPs for webhook validation

### Payment Flow

```
1. Customer clicks "Place Order"
       |
2. POST /api/checkout
   -> generatePaymentData(order)
   -> generateSignature(params + passphrase)
   -> Return PayFast form data
       |
3. Customer redirected to PayFast payment page
       |
4. On success: Redirect to /checkout/success?order_id={id}
   On cancel:  Redirect to /checkout/cancel?order_id={id}
       |
5. PayFast sends ITN webhook -> POST /api/webhooks/payfast
   -> Validate source IP (19 whitelisted IPs)
   -> Validate MD5 signature
   -> Extract payment_status and order_id
   -> COMPLETE: Update order to "paid", save payment_reference
   -> CANCELLED: Mark payment as cancelled
   -> Add entry to order_status_history
```

### Security
- IP whitelist validation (bypassed in sandbox mode)
- MD5 signature verification on all webhook payloads
- Passphrase-based signature generation

---

## Email Notifications

**Files:** `src/lib/email/resend.ts`, `src/lib/email/templates.ts`

All emails sent via Resend with consistent HTML branding wrapper.

| # | Template | Trigger | Content |
|---|----------|---------|---------|
| 1 | **Order Confirmation** | Order placed | Order number, total, dashboard link |
| 2 | **Payment Received** | PayFast ITN (COMPLETE) | Order number, confirmation, next steps (proof review) |
| 3 | **Proof Ready** | Admin uploads proof | Order number, review link, approve/revision instructions |
| 4 | **Order Shipped** | Admin marks shipped | Order number, tracking number, estimated delivery (3-5 days) |
| 5 | **Welcome** | New registration | Welcome message, feature overview, CTA to start first order |
| 6 | **Proof Approved (Admin)** | Customer approves proof | Customer name, order number, revision notes, production link |
| 7 | **Proof Revision (Admin)** | Customer requests revision | Customer name, order number, revision notes (highlighted), re-upload prompt |
| 8 | **Contact Form** | Contact page submission | Name, email, subject, message — sent to admin for follow-up |

---

## Pricing Engine

**Files:** `src/lib/pricing/calculator.ts`, `src/lib/pricing/quick-calculator.ts`

### Calculation Flow

```
1. Base Price per unit (from constants)
       x
2. Size Factor = (width_mm * height_mm) / (base_width * base_height)
       x
3. Material Multiplier (White Vinyl: 1.0, Clear: 1.2, Chrome: 1.5, Reflective: 1.8, Holographic: 2.0)
       x
4. Finish Multiplier (Gloss: 1.0, Matte: 1.05, Satin: 1.03)
       x
5. Adhesion Multiplier (Standard: 1.0, High-Tack: 1.1, Removable: 1.15)
       x
6. Shape Multiplier (Standard: 1.0, Die-Cut: 1.2, Kiss-Cut: 1.1)
       +
7. 3D Doming Surcharge (R3.50/unit if enabled)
       x
8. Volume Tier Discount
   | Quantity | Discount |
   |----------|----------|
   | 1-49     | None     |
   | 50-99    | Applied  |
   | 100-249  | Applied  |
   | 250-499  | Applied  |
   | 500-999  | Applied  |
   | 1000+    | Maximum  |
       =
9. Unit Price (rounded to 2 decimal places)
       x
10. Quantity = Subtotal
       +
11. VAT (15%) = Tax
       =
12. Total

Free delivery if subtotal >= R500, otherwise flat R85 shipping
```

### Price Breakdown
The calculator returns a detailed `breakdown` array with each factor labeled for transparent pricing display to customers.

---

## Middleware & Route Protection

**Files:** `src/middleware.ts`, `src/lib/supabase/middleware.ts`

### How It Works
- Supabase middleware runs on every request
- Refreshes auth session cookies automatically
- Checks user role for protected routes

### Route Protection Rules

| Route Pattern | Protection | Required Role |
|--------------|------------|---------------|
| `/` | Public | None |
| `/products/*` | Public | None |
| `/blog/*` | Public | None |
| `/login`, `/register` | Public (redirects if logged in) | None |
| `/account/*` | Authenticated | Any logged-in user |
| `/designer/*` | Authenticated | Any logged-in user |
| `/checkout` | Authenticated | Any logged-in user |
| `/admin/*` | Authenticated + Role | `admin` or `production_staff` |

Unauthenticated users accessing protected routes are redirected to `/login?redirect={original_path}`.

---

## User Roles & Permissions

| Role | Storefront | Designer | Orders | Admin Panel | User Mgmt | Products | Blog | Settings |
|------|-----------|----------|--------|-------------|-----------|----------|------|----------|
| `customer` | Full | Full | Own only | No | No | No | No | No |
| `production_staff` | Full | Full | View all | Limited | No | View | No | No |
| `admin` | Full | Full | Manage all | Full | Full | Full CRUD | Full CRUD | Full |

---

## Database Schema

### Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User profiles | id, email, full_name, company_name, phone, role, address fields |
| `product_groups` | Product categories | id, name, slug, description, division, image_url, display_order, is_active |
| `product_templates` | Design templates | id, product_group_id, name, width_mm, height_mm, dpi, bleed_mm, safe_zone_mm |
| `template_parameters` | Configurable options | id, template_id, key, label, type, options, display_order |
| `pricing_rules` | Dynamic pricing | id, product_group_id, rule_type, conditions, value |
| `designs` | Saved designs | id, user_id, template_id, name, canvas_json, thumbnail_url |
| `orders` | Customer orders | id, user_id, status, total, shipping_address, billing_address, payment_reference |
| `order_items` | Line items | id, order_id, product_template_id, quantity, unit_price, selected_params |
| `order_status_history` | Audit trail | id, order_id, status, notes, created_at |
| `proofs` | Design proofs | id, order_item_id, file_url, status, revision_notes |
| `production_files` | Print-ready files | id, order_item_id, file_url, format, generated_at |
| `csv_jobs` | Bulk processing | id, user_id, template_id, status, progress, row_count, error_log |
| `uploaded_files` | User uploads | id, user_id, file_url, file_type, file_size |
| `blog_posts` | Blog articles | id, title, slug, content, excerpt, author, featured_image, published, featured |
| `testimonials` | Customer reviews | id, customer_name, company, location, rating, review, featured, published |
| `site_settings` | Config store | id, key, value |

---

## API Routes

### Public APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/products` | List product groups with filters |
| GET | `/api/blog` | List published blog posts |
| GET | `/api/testimonials` | List published testimonials |
| GET | `/api/settings` | Get public site settings |

### Auth APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/callback` | Supabase auth callback handler |

### Order & Payment APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/orders` | Create new order |
| GET | `/api/orders/[id]` | Get order details |
| POST | `/api/checkout` | Initialize PayFast payment session |
| POST | `/api/webhooks/payfast` | Handle PayFast ITN notifications |

### Design & Proof APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/designs` | Save a design |
| GET | `/api/designs/[id]` | Load a saved design |
| POST | `/api/proofs/generate` | Generate proof PDF |
| POST | `/api/proofs/[id]/approve` | Customer approves proof |
| POST | `/api/proofs/[id]/revision` | Customer requests revision |

### CSV APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/csv/upload` | Upload and validate CSV file |
| GET | `/api/csv/[id]/status` | Check processing progress |
| POST | `/api/csv/[id]/generate` | Trigger batch file generation |

### Email API

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/email/send` | Send transactional email |

### Admin APIs

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET/POST | `/api/admin/orders` | List/manage orders |
| GET/PUT | `/api/admin/orders/[id]` | Get/update specific order |
| GET/POST | `/api/admin/products` | List/create products |
| PUT/DELETE | `/api/admin/products/[id]` | Update/delete product |
| GET/POST | `/api/admin/blog` | List/create blog posts |
| PUT/DELETE | `/api/admin/blog/[id]` | Update/delete blog post |
| GET | `/api/admin/users` | List users with filters |
| GET/PUT | `/api/admin/users/[id]` | Get/update user |
| GET/POST | `/api/admin/testimonials` | List/create testimonials |
| PUT/DELETE | `/api/admin/testimonials/[id]` | Update/delete testimonial |
| GET/PUT | `/api/admin/settings` | Get/update site settings |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Auth layout group
│   │   ├── login/                 # Login page
│   │   ├── register/              # Registration page
│   │   └── reset-password/        # Password reset page
│   ├── (main)/                    # Main public layout group
│   │   ├── page.tsx               # Home page
│   │   ├── products/              # Product catalog & detail pages
│   │   ├── templates/             # Design template gallery
│   │   ├── designer/              # Design wizard canvas
│   │   │   └── [templateId]/
│   │   │       ├── page.tsx       # Designer page
│   │   │       └── csv/           # CSV bulk processing
│   │   ├── cart/                  # Shopping cart
│   │   ├── checkout/              # Checkout flow
│   │   ├── order-now/             # Quick order form
│   │   ├── account/               # Customer account
│   │   │   ├── orders/            # Order history & details
│   │   │   ├── designs/           # Saved designs gallery
│   │   │   └── profile/           # Profile management
│   │   ├── blog/                  # Public blog
│   │   ├── about/                 # About page
│   │   ├── our-story/             # Company story
│   │   ├── contact/               # Contact form
│   │   ├── faq/                   # FAQ accordion
│   │   ├── testimonials/          # Testimonials page
│   │   ├── why-choose-us/         # Benefits page
│   │   ├── delivery-info/         # Delivery information
│   │   ├── privacy/               # Privacy policy
│   │   └── terms/                 # Terms of service
│   ├── admin/                     # Admin panel (role-protected)
│   │   ├── page.tsx               # Dashboard with stats
│   │   ├── orders/                # Order pipeline management
│   │   ├── products/              # Product CRUD
│   │   ├── blog/                  # Blog management
│   │   ├── users/                 # User management
│   │   ├── testimonials/          # Testimonials management
│   │   └── settings/              # Site settings
│   ├── api/                       # API routes
│   │   ├── admin/                 # Admin endpoints
│   │   ├── auth/                  # Auth callback
│   │   ├── blog/                  # Blog endpoints
│   │   ├── checkout/              # PayFast checkout
│   │   ├── csv/                   # CSV processing
│   │   ├── designs/               # Design CRUD
│   │   ├── email/                 # Email sending
│   │   ├── orders/                # Order endpoints
│   │   ├── products/              # Product endpoints
│   │   ├── proofs/                # Proof management
│   │   ├── settings/              # Settings endpoint
│   │   ├── testimonials/          # Testimonials endpoint
│   │   └── webhooks/payfast/      # PayFast ITN webhook
│   ├── globals.css                # Tailwind + theme CSS variables
│   ├── layout.tsx                 # Root layout
│   ├── middleware.ts              # Auth middleware
│   ├── robots.ts                  # SEO robots.txt
│   └── sitemap.ts                 # SEO sitemap.xml
├── components/
│   ├── ui/                        # 16 shadcn/ui components
│   ├── layout/                    # Header, Footer, AdminSidebar, TopBar, TrustBadgesBar
│   ├── designer/                  # Canvas editor components
│   │   ├── DesignerCanvas.tsx     # Main Fabric.js canvas (SSR disabled)
│   │   ├── Toolbar.tsx            # Left toolbar with tabbed panels
│   │   ├── PropertiesPanel.tsx    # Right properties panel
│   │   ├── LayersPanel.tsx        # Layer management
│   │   ├── ExportDialog.tsx       # Export modal
│   │   ├── ColorPicker.tsx        # Color selection
│   │   ├── GradientPicker.tsx     # Gradient editor
│   │   └── panels/               # TextPanel, ImageFiltersPanel, QRCodePanel, BarcodePanel, ShapesPanel
│   ├── admin/                     # DashboardStats, OrderPipeline
│   ├── home/                      # HeroCalculator, HowItWorks, DivisionShowcase, TestimonialsCarousel
│   ├── products/                  # ProductCard, ProductConfigurator
│   ├── order/                     # QuickOrderForm
│   ├── blog/                      # Blog components
│   └── seo/                       # SEO components
├── hooks/                         # Zustand stores
│   ├── useAuth.ts                 # Auth state & actions
│   ├── useCart.ts                 # Cart state & actions
│   ├── useDesigner.ts             # Designer state
│   └── useSiteSettings.ts         # Site settings state
├── lib/
│   ├── supabase/                  # Supabase clients
│   │   ├── client.ts              # Browser client
│   │   ├── server.ts              # Server client
│   │   ├── admin.ts               # Admin/service-role client
│   │   └── middleware.ts          # Auth middleware logic
│   ├── designer/                  # Canvas engine
│   │   ├── editor.ts              # Plugin system orchestrator
│   │   ├── event-bus.ts           # Event communication
│   │   ├── canvas-utils.ts        # Canvas helper functions
│   │   ├── constraints.ts         # Object constraints
│   │   ├── fonts.ts               # Google Fonts loader
│   │   ├── store.ts               # Designer state store
│   │   ├── types.ts               # Designer type definitions
│   │   └── plugins/               # 21 canvas plugins (see full list above)
│   ├── payfast/config.ts          # PayFast gateway configuration
│   ├── email/                     # Resend client & 8 email templates
│   ├── pricing/                   # Dynamic pricing calculator & quick calculator
│   ├── csv/variable-renderer.ts   # CSV variable data renderer
│   └── utils/                     # Constants, formatters
├── types/index.ts                 # Global TypeScript type definitions
└── middleware.ts                  # Next.js middleware entry point
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- A [Supabase](https://supabase.com) project (database + auth)
- A [PayFast](https://www.payfast.co.za) merchant account (for payments)
- A [Resend](https://resend.com) account (for emails)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd speedyprint
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# PayFast
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_SANDBOX=true

# Resend (Email)
RESEND_API_KEY=your_resend_api_key
```

### 4. Set Up Supabase Database

Create all required tables in your Supabase project (see [Database Schema](#database-schema) section). Enable Row Level Security (RLS) on all tables.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Create Admin User

Register a new account at `/register`, then run this SQL in Supabase SQL Editor to promote to admin:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Dev | `npm run dev` | Start development server with hot reload |
| Build | `npm run build` | Create optimized production build |
| Start | `npm run start` | Start production server |
| Lint | `npm run lint` | Run ESLint checks |

---

## Security

- **Supabase RLS** — Row Level Security on all database tables
- **RBAC** — Role-based access control via middleware
- **Protected Routes** — `/account/*` (auth), `/admin/*` (admin/production_staff)
- **PayFast Validation** — IP whitelist (19 IPs) + MD5 signature verification on webhooks
- **Service Role** — Admin operations use Supabase service role key (server-side only)
- **Security Headers:**
  - `Strict-Transport-Security` (HSTS)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` (restricted camera, microphone, geolocation)
- **File Upload Limits** — 50MB max, restricted to PNG/JPEG/SVG/PDF
- **Server Actions** — 50MB body size limit configured in Next.js

---

## Theme & Design Tokens

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `brand-primary` | `#FF6B00` | Orange — buttons, CTAs, highlights |
| `brand-secondary` | `#1E3A5F` | Dark Navy — header, footer, backgrounds |
| `brand-accent` | `#00C853` | Green — success states, badges |
| `brand-text` | `#1A1A1A` | Primary text color |
| `brand-text-muted` | `#6B7280` | Secondary/muted text |
| `brand-bg` | `#F5F5F5` | Page background |
| `brand-surface` | `#FFFFFF` | Card/component surfaces |

### Typography

| Token | Font | Weights |
|-------|------|---------|
| Heading | Poppins | 600, 700 |
| Body | Inter | 400, 500, 600 |
| Mono | JetBrains Mono | 400 |

### UI Components (shadcn/ui)

Accordion, Avatar, Badge, Button (with `loading` prop), Card, Dialog, Dropdown Menu, Input, Label, Select, Separator, Sheet, Table, Tabs, Textarea, Toast (Sonner)

---

## License

All rights reserved.

That's the complete README file — it's already saved at the project root (`README.md`). It covers every page, feature, plugin, API route, database table, and configuration detail of the SpeedyPrint platform.
