# SKII — Client

The React front-end for the Smart Kitchen Inventory Intelligence platform. Built with **Vite 7**, **React 19**, **Tailwind CSS v4**, **shadcn/ui**, and **Redux Toolkit + RTK Query**.

---

## Folder Structure

```
src/
├── App.jsx                        # Root component — role-based app switcher
├── main.jsx                       # Entry point (BrowserRouter + Redux Provider + AuthProvider)
├── index.css                      # Global Tailwind base styles
│
├── apps/                          # Top-level app shells (one per role)
│   ├── brand-admin/
│   │   └── brand-admin-app.jsx    # Sidebar layout + routes for BRAND_ADMIN
│   ├── outlet-admin/
│   │   └── outlet-admin-app.jsx   # Sidebar layout + routes for OUTLET_MANAGER
│   └── super-admin/
│       └── super-admin-app.jsx    # Sidebar layout + routes for SUPER_ADMIN
│
├── auth/
│   ├── auth.js                    # useAuth() hook — reads AuthContext
│   ├── AuthContext.jsx            # Provides user state; persists to localStorage
│   └── protected.jsx              # ProtectedRoute — guards by role + permission
│
├── routes/
│   ├── brand-routes.jsx           # Route config for BrandAdmin pages
│   ├── outlet-routes.jsx          # Route config for OutletManager (with permission flags)
│   └── super-routes.jsx           # Route config for SuperAdmin pages
│
├── pages/
│   ├── login.jsx                  # Login page
│   ├── ForgotPassword.jsx         # Forgot-password OTP flow
│   ├── brand-admin/
│   │   ├── brand-admin.jsx        # Outlet list / brand dashboard
│   │   ├── menu.jsx               # Menu items list
│   │   ├── menu-item.jsx          # Single menu item detail
│   │   ├── recipe.jsx             # Recipe list
│   │   ├── create-recipe.jsx      # Recipe builder (useRecipeBuilder hook)
│   │   ├── ingredient.jsx         # Ingredient master list
│   │   ├── unit.jsx               # Measurement unit management
│   │   ├── outlet.jsx             # Single outlet view
│   │   └── analytics/
│   │       ├── overview.jsx       # Deployment-level analytics dashboard
│   │       └── menu-item-analyitcs.jsx  # Item-level analytics
│   ├── outlet-manager/
│   │   ├── stocks.jsx             # Live stock dashboard
│   │   ├── orders.jsx             # Order history
│   │   ├── Restocks.jsx           # Purchase / restock form
│   │   ├── StockMovement.jsx      # All stock movements
│   │   └── consumption.jsx        # Ingredient consumption report
│   └── super-admin/
│       ├── super-admin.jsx        # Tenant/brand list
│       ├── brand.jsx              # Single brand detail
│       └── scheduler-monitor.jsx  # Cron job log viewer
│
├── components/
│   ├── site-header.jsx            # Top-bar / page header
│   ├── AnalyticsHeader.jsx        # Analytics header with date range picker
│   ├── data-range-picker.jsx      # Date range picker wrapper
│   ├── emailOtpVerification.jsx   # 6-digit OTP input component
│   ├── menu-matrix.jsx            # Menu Engineering Matrix (BCG quadrant table)
│   ├── MultiUnitPicker.jsx        # Multi-unit selector for ingredients
│   ├── OrderDetailsModal.jsx      # Sale order detail modal
│   ├── canceled-ingredient.jsx    # Shows canceled-ingredient details per order
│   ├── export-banner.jsx          # CSV export trigger + status banner
│   ├── empty.jsx                  # Empty state with Lottie animation
│   ├── error.jsx                  # Error state component
│   ├── success.jsx                # Success state component
│   ├── permission.jsx             # Permission check wrapper
│   ├── permission-denied.jsx      # 403 page
│   ├── not-found.jsx              # 404 page
│   ├── laoder.jsx                 # Full-page loading spinner
│   ├── resuable.jsx               # Small reusable presentational pieces
│   ├── accordian-card/
│   │   └── accordian.jsx          # Collapsible card wrapper
│   ├── card/
│   │   ├── card.jsx               # Generic stat card
│   │   └── grid.jsx               # Card grid layout
│   ├── charts/
│   │   └── bar-chart.jsx          # Recharts bar chart wrapper
│   ├── common/
│   │   ├── ConfirmModal.jsx       # Generic confirmation dialog
│   │   └── CsvScanner.jsx         # Drag-and-drop CSV upload + client-side validation
│   ├── data-card/
│   │   ├── data-card.jsx          # Stats display card
│   │   └── table.jsx              # TanStack Table wrapper (sort + pagination)
│   ├── Form/                      # Role-scoped form components
│   │   ├── brand-admin-form/      # Outlet, ingredient, menu-item, recipe forms
│   │   ├── outlet-manager-form/   # Restock, stock-adjustment forms
│   │   └── super-admin-form/      # Tenant / brand-manager creation forms
│   ├── login/
│   │   ├── login-form.jsx         # Email + password login form
│   │   └── welcome-card.jsx       # Decorative left-panel on the login screen
│   ├── side-bar/
│   │   ├── app-sidebar.jsx        # Main sidebar shell
│   │   ├── nav-liveanalytics.jsx  # Sidebar nav item list
│   │   └── nav-user.jsx           # User info + logout in sidebar footer
│   └── site-card/
│       ├── site-card.jsx          # Individual outlet summary card
│       └── site-cards.jsx         # Grid of site cards
│
├── redux/
│   ├── store.js                   # Redux store — baseApi + feature reducers
│   ├── apis/
│   │   ├── baseApi.js             # RTK Query base; auto-handles 401 & 429
│   │   ├── userApi.js             # /users endpoints
│   │   ├── tenantApi.js           # /tenants endpoints
│   │   ├── outletApi.js           # /outlets endpoints
│   │   ├── menuItemApi.js         # /menu-items endpoints
│   │   ├── ingredientApi.js       # /ingredients endpoints
│   │   ├── recipeApi.js           # /recipes endpoints
│   │   ├── unitApi.js             # /units endpoints
│   │   ├── stockApi.js            # /stocks endpoints
│   │   ├── stockMovementApi.js    # /stock-movements endpoints
│   │   ├── saleApi.js             # /sales endpoints
│   │   ├── analyticsApi.js        # /analytics endpoints
│   │   └── csvApi.js              # /csv endpoints
│   └── reducers/
│       ├── brand-admin/
│       │   └── dashboardFilters.js  # Date-range + selected outlet filter slice
│       └── outlet-manager/
│           └── stockSlice.js        # Optimistic stock state for real-time updates
│
├── customHooks/
│   ├── desktop.js                 # useDesktop() — viewport media query
│   ├── useMobile.js               # useIsMobile() — mobile media query
│   └── useRecipeBuilder.js        # Complex recipe CRUD state management hook
│
├── sockets/
│   └── sockets.js                 # Socket.IO singleton + custom event hooks
│                                  #   useStockSocket, useStockMovementSocket, useSalesSocket
│
├── utils/
│   ├── render-routes.jsx          # Maps route config array → <Route> with ProtectedRoute
│   ├── csv.validator.js           # Client-side CSV schema validation
│   ├── password.js                # Password strength helpers
│   ├── analyitcs/                 # Analytics data transform utilities
│   └── columns/                   # TanStack Table column definitions per entity
│
├── assets/
│   └── no-data.json               # Lottie animation JSON for empty states
│
└── lib/
    └── utils.js                   # cn() helper (clsx + tailwind-merge)
```

---

## Application Flow

### Authentication

```
User visits /
  → App.jsx calls useAuth()
  → user == null → show Login / ForgotPassword
  → User submits credentials → POST /api/v1/users/auth/login
  → Server sets httpOnly accessToken cookie
  → AuthContext stores user object in localStorage
  → App.jsx re-renders → role switch → correct App shell mounted
```

### Role-Based Routing

```
App.jsx
 ├── SUPER_ADMIN    → <SuperAdminApp />   (tenants, brands, scheduler monitor)
 ├── BRAND_ADMIN    → <BrandAdminApp />   (outlets, menu, recipes, ingredients, analytics)
 └── OUTLET_MANAGER → <OutletAdminApp />  (stocks, restocks, orders, movements, consumption)
```

Each app shell builds its sidebar nav and renders its route list via `renderRoutes()`. `ProtectedRoute` checks role and permissions before mounting.

### OUTLET_MANAGER Permission Gating

Nav items and routes are dynamically filtered at render time based on `user.outletManagerPermissions`:

| Permission Flag | Unlocks |
|---|---|
| `RESTOCK` | Stocks page, Restock page |
| `ANALYTICS` | Orders, StockMovement, Consumption pages |

### Real-Time Order / Stock Update Flow

```
POS → POST /api/v1/sales
  ↓ Server enqueues job to BullMQ "orders" queue
  ↓ Worker: deducts stock + creates StockMovement + evaluates alerts
  ↓ Worker emits socket event via "worker_emit" to server
  ↓ Socket.IO broadcasts to room  tenant:{id}:outlet:{id}
  ↓ Client hooks (useStockSocket / useSalesSocket) receive event
  ↓ React state updates → stock levels refresh instantly
```

---

## State Management

### Redux Store

```
store
├── api              ← RTK Query cache (all server data lives here)
├── dashboardFilters ← date range + selected outlet (BrandAdmin analytics)
└── Stock            ← local optimistic stock state (OutletManager)
```

### RTK Query

All API calls go through `baseApi` with automatic caching, tag-based invalidation, and global error interception:

- **Auto 401** — clears localStorage + Redux state, redirects to `/`
- **Auto 429** — shows a Sonner toast with the rate-limit message
- **Cache tags** — mutations invalidate related query caches, triggering refetches only where needed

---

## Optimization Techniques

### Bulk / Batched API Calls
Client-side CSV uploads are parsed with **PapaParser**, validated against a schema in `csv.validator.js`, then dispatched as a **single bulk payload** to the server:

| Endpoint | What is batched |
|---|---|
| `POST /ingredients/bulk` | All rows from an ingredients CSV |
| `POST /recipes/bulk` | All rows from a recipes CSV |
| `POST /stock-movements/bulk` | All rows from a restocks CSV |

This reduces N individual round-trips to a single HTTP request.

### Optimistic UI Updates
`stockSlice` updates local stock state immediately upon user action before the server responds, avoiding perceived latency in the restock form.

### Socket.IO Incremental Updates
Rather than refetching the entire dataset after each change, three event-driven hooks update only the affected items:

| Hook | Socket event | Effect |
|---|---|---|
| `useStockSocket` | `stock_updated` | Updates single stock entry |
| `useStockMovementSocket` | `STOCK_MOVEMENT_CREATED` | Prepends new movement |
| `useSalesSocket` | `NEW_SALE` | Prepends new sale |

### TanStack Table v8
All large data tables use headless client-side sorting and pagination — no extra server round-trips for display operations.

### Responsive Layout Gating
`useDesktop()` and `useIsMobile()` prevent rendering heavy desktop layouts on mobile and vice-versa, keeping the DOM lean.

---

## Key Components

| Component | Role |
|---|---|
| `AuthContext.jsx` | User state, localStorage sync, `setUser` |
| `protected.jsx` | Role + permission guard before route render |
| `baseApi.js` | RTK Query root — intercepts 401/429 globally |
| `app-sidebar.jsx` | Collapsible role-adaptive sidebar |
| `table.jsx` (data-card) | TanStack Table with sort, pagination, column config |
| `CsvScanner.jsx` | Drag-and-drop, PapaParser, schema validation |
| `menu-matrix.jsx` | BCG-style Menu Engineering Matrix |
| `useRecipeBuilder.js` | Ingredient list add/remove/update + bulk save |
| `sockets.js` | Socket.IO singleton + three custom hooks |
| `render-routes.jsx` | Converts route config array to `<Route>` elements |
| `export-banner.jsx` | Triggers async CSV export job, awaits email |
| `data-range-picker.jsx` | Start/end date selection for analytics filters |

---

## Component Library (shadcn/ui)

Pre-built accessible components under `src/components/ui/`:

`accordion` · `alert-dialog` · `avatar` · `badge` · `button` · `card` · `chart` · `checkbox` · `dialog` · `dropdown-menu` · `field` · `input` · `label` · `select` · `separator` · `sheet` · `sidebar` · `skeleton` · `table` · `tooltip`

All are built on **Radix UI** primitives, styled with **Tailwind CSS v4**.

---

## Running the Client

```bash
cd client
npm install
npm run dev       # http://localhost:5173
npm run build     # Production build
npm run preview   # Preview production build locally
```

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
