# SKII — Server

The Node.js / Express 5 back-end for the Smart Kitchen Inventory Intelligence platform.

---

## Running

```bash
cd server
npm install

npm run dev              # API server  (port 8000)
npm run start:worker     # BullMQ worker pool
npm run start:scheduler  # Cron scheduler
```

> All three processes must run simultaneously for full functionality.

---

## Environment Variables

All variables are validated at startup in `src/utils/config.js`. A missing required variable throws immediately at boot.

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | HTTP port (default `8000`) |
| `NODE_ENV` | No | `development` / `production` |
| `MONGO_URI` | **Yes** | MongoDB Atlas connection string |
| `ACCESS_TOKEN_SECRET` | **Yes** | JWT signing secret |
| `ACCESS_TOKEN_EXPIRY` | **Yes** | JWT expiry (e.g. `7d`) |
| `SMTP_HOST` | **Yes** | SMTP relay hostname |
| `SMTP_PORT` | **Yes** | SMTP port (e.g. `587`) |
| `SMTP_USER` | **Yes** | SMTP username |
| `SMTP_PASS` | **Yes** | SMTP password |
| `REDIS_URI` | **Yes** | Redis connection URL |
| `AWS_ACCESS_KEY_ID` | **Yes** | IAM key with S3 write permissions |
| `AWS_SECRET_ACCESS_KEY` | **Yes** | IAM secret |
| `AWS_REGION` | **Yes** | S3 bucket region |
| `AWS_S3_BUCKET` | **Yes** | S3 bucket name for CSV exports |
| `CLIENT_URL` | No | Frontend origin added to CORS whitelist |

---

## Project Structure

```
server/
├── app.js                          # Express bootstrap, HTTP server, Socket.IO init
└── src/
    ├── scheduler.js                # Entry point for the scheduler process
    ├── controllers/                # Route handler logic (one file per resource)
    ├── routes/                     # Express routers (one file per resource)
    ├── models/                     # Mongoose schemas & models
    ├── middlerwares/               # Auth + rate-limiter middleware
    ├── services/                   # Business-logic helpers
    ├── queues/                     # BullMQ queue definitions
    ├── workers/                    # BullMQ worker process entry points
    ├── proccessors/                # Pure job-processor functions (called by workers)
    ├── crons/                      # node-cron job definitions
    ├── sockets/                    # Socket.IO server initialisation
    └── utils/                      # Config, DB, Redis, JWT, email, error helpers
```

---

## API Endpoints

All routes are mounted under `/api/v1`. Every route passes through the **general rate limiter** (1 000 req/min per user, Redis-backed).

---

### Users  `/api/v1/users`

| Method | Path | Auth | Rate limit | Description |
|---|---|---|---|---|
| `POST` | `/auth/login` | — | Auth | Sign in; server sets `accessToken` httpOnly cookie |
| `POST` | `/auth/logout` | — | — | Clear the auth cookie |
| `GET` | `/me` | JWT | — | Return current authenticated user |
| `GET` | `/brand-managers` | JWT | — | List all brand managers for the caller's tenant |
| `DELETE` | `/brand-managers/:managerId` | JWT | — | Remove a brand manager |
| `POST` | `/auth/signup/otp` | JWT | Auth | Send email OTP to invite a brand manager |
| `POST` | `/auth/signup/verify` | JWT | Auth | Verify OTP for brand-manager signup |
| `POST` | `/brand-managers` | JWT | — | Complete brand-manager account creation |
| `GET` | `/outlet-managers` | JWT | — | List all outlet managers for the tenant |
| `DELETE` | `/outlet-managers/:managerId` | JWT | — | Remove an outlet manager |
| `POST` | `/auth/outlet-managers/otp` | JWT | Auth | Send email OTP to invite an outlet manager |
| `POST` | `/auth/outlet-managers/verify` | JWT | Auth | Verify OTP for outlet-manager onboarding |
| `POST` | `/outlet-managers` | JWT | — | Complete outlet-manager account creation |
| `PUT` | `/outlet-managers/:userId/permissions` | JWT | — | Toggle `RESTOCK` / `ANALYTICS` permission flags |
| `POST` | `/auth/forgot-password/request-otp` | — | Auth | Send password-reset OTP |
| `POST` | `/auth/forgot-password/verify-otp` | — | Auth | Verify reset OTP |
| `POST` | `/auth/forgot-password/reset` | — | Auth | Set new password after OTP verification |

> Auth rate limit: **20 req per 10 min** per IP.

---

### Tenants  `/api/v1/tenants`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | JWT | Create a new tenant (SUPER_ADMIN) |
| `GET` | `/` | JWT | List all tenants |
| `DELETE` | `/:tenantId` | JWT | Delete a tenant |

---

### Outlets  `/api/v1/outlets`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | JWT | Create an outlet scoped to the caller's tenant |
| `GET` | `/` | JWT | List outlets (scoped to caller's tenant) |
| `DELETE` | `/:outletId` | JWT | Delete an outlet |

---

### Menu Items  `/api/v1/menu-items`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | JWT | Create a menu item |
| `GET` | `/` | JWT | List all menu items for the tenant |
| `DELETE` | `/:menuItemId` | JWT | Delete a menu item |

---

### Units  `/api/v1/units`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | JWT | Create a measurement unit with base-unit conversion rate |
| `GET` | `/` | JWT | List all units for the tenant |

---

### Ingredients  `/api/v1/ingredients`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | JWT | Create a single ingredient master |
| `POST` | `/bulk` | JWT | Bulk-create ingredients from a CSV payload |
| `GET` | `/` | JWT | Paginated ingredient list |
| `GET` | `/all` | JWT | All ingredients in one response (no pagination — for dropdowns) |
| `DELETE` | `/:ingredientId` | JWT | Delete an ingredient |

---

### Recipes  `/api/v1/recipes`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | JWT | Create or update the recipe for a menu item |
| `POST` | `/bulk` | JWT | Bulk-create recipes from a CSV payload |
| `GET` | `/:itemId` | JWT | Get the recipe for a specific menu item |

---

### Stocks  `/api/v1/stocks`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | JWT | Current stock levels for the outlet with alert states |

---

### Stock Movements  `/api/v1/stock-movements`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/` | JWT | Create a single stock movement (PURCHASE / ADJUSTMENT) |
| `POST` | `/bulk` | JWT | Bulk-create stock movements |
| `GET` | `/` | JWT | List non-order movements (PURCHASE, ADJUSTMENTS) |
| `GET` | `/orders` | JWT | List ORDER-type movements |
| `GET` | `/consumption` | JWT | Ingredient usage + burn rate analytics |

---

### Sales  `/api/v1/sales`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | JWT | List all sales for the outlet |
| `POST` | `/` | — | Create a new sale (POS push — intentionally unauthenticated) |

> `POST /sales` places a job on the BullMQ `orders` queue. Stock deduction and snapshot processing happen asynchronously in workers.

---

### Analytics  `/api/v1/analytics`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/ingredients/usage` | JWT | Ingredient usage + burn rate per ingredient |
| `POST` | `/reports/deployment-snapshot` | JWT | Revenue / COGS from pre-aggregated snapshot data |
| `POST` | `/reports/deployment-live` | JWT | Revenue / COGS from live sales collection |
| `POST` | `/reports/item-snapshot` | JWT | Per-item revenue / qty from snapshot data |
| `POST` | `/reports/item-live` | JWT | Per-item revenue / qty from live sales |
| `GET` | `/menu-matrix` | JWT | Menu Engineering Matrix (popularity × profitability) |
| `POST` | `/reports/export` | JWT | Enqueue async CSV export job |
| `GET` | `/outlets` | JWT | Outlets accessible to the caller (for filter dropdowns) |

---

### CSV  `/api/v1/csv`

| Method | Path | Auth | Rate limit | Description |
|---|---|---|---|---|
| `GET` | `/export/:type` | JWT | CSV (5/5 min) | Stream-download a CSV export of `type` |
| `GET` | `/template/:type` | JWT | — | Download blank import CSV template |

---

### Scheduler Logs  `/api/v1/scheduler-logs`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | List cron execution logs (status, duration, error) |

---

### Debug Utilities  `/api/v1`

| Method | Path | Description |
|---|---|---|
| `GET` | `/get_all_tenants` | Raw tenant dump |
| `GET` | `/get_all_outlets` | Raw outlet dump |
| `GET` | `/get_all_items` | Raw menu-item dump |

---

## Middleware

### `verifyJwt`  (`src/middlerwares/auth.middleware.js`)

Wraps Passport's `jwt` strategy. Reads the `accessToken` httpOnly cookie, verifies the JWT signature, and attaches the decoded payload to `req.user`. Returns `401` with a specific message on failure:

| Scenario | Message |
|---|---|
| Missing cookie | `Access token missing` |
| Invalid / tampered token | `Invalid or expired access token` |
| Expired token | `Invalid or expired access token` |

### Rate Limiters  (`src/middlerwares/rateLimiter.middleware.js`)

All limiters use **Redis** as their counter store (via `rate-limit-redis`) so limits are shared across multiple server instances.

| Limiter | Window | Max | Key | Used on |
|---|---|---|---|---|
| `generalRateLimit` | 1 min | 1 000 | user `_id` or IP | All routes |
| `authRateLimit` | 10 min | 20 | IP only | Auth endpoints |
| `csvRateLimit` | 5 min | 5 | user `_id` or IP | `GET /csv/export/:type` |

On breach → `429` with `Retry-After` header set.

---

## BullMQ Queues & Workers

Workers are **forked child processes** managed by `src/workers/startWorkers.js`. If a worker crashes, it is automatically restarted.

### Queue: `orders`

**Definition:** `src/queues/order.queue.js`  
**Default job options:** 5 attempts, exponential backoff from 1 s, retain 100 completed / 1 000 failed jobs.

**Workers:** 4× `order.worker.js` processes, each with `concurrency: 5` (20 parallel job slots total).

| Job name | Processing steps |
|---|---|
| `sale.confirmed` | 1. `processStockMovement` — deduct ingredients, create `StockMovement` docs, emit `STOCK_MOVEMENT_CREATED` via Socket.IO  2. `processSalesSnapshot` — upsert `Sale` as `CONFIRMED`, emit `NEW_SALE`  3. `processAlerts` — check thresholds → update `alertState`, emit `stock_updated` |
| `sale.failed` | `processSalesSnapshot` — records sale as `CANCELED` / `PARTIAL` |

Jobs that exhaust all 5 retry attempts write a `QueueFail` document for the DLQ retry cron to recover.

---

### Queue: `daily-snapshot`

**Definition:** `src/queues/dailySnapshot.queue.js`  
**Worker:** 1× `dailySnapshot.worker.js`, `concurrency: 1`.

Two processors run in **parallel** via `Promise.allSettled`:

| Processor | What it does |
|---|---|
| `processDailySnapshot` | Aggregates yesterday's sales per outlet → upserts `TenantDailySnapshot` |
| `processDailyItemSnapshot` | Aggregates per outlet per item → upserts `OutletItemDailySnapshot` |

A partial failure (one succeeds, one fails) is logged individually without blocking the other.

---

### Queue: `csv-export`

**Definition:** `src/queues/csvExport.queue.js`  
**Worker:** 1× `csvExport.worker.js`.

Processing flow:
1. `generateReportRows()` yields rows from MongoDB (async generator — memory-efficient)
2. Rows pipe into a `fast-csv` write stream
3. Stream pipes via `PassThrough` into an AWS S3 multipart `Upload` (`@aws-sdk/lib-storage`)
4. On upload complete, pre-sign a GET URL (7-day expiry) via `@aws-sdk/s3-request-presigner`
5. Email the download link to the requesting user via Nodemailer

---

## Cron Jobs (Scheduler Process)

The scheduler runs as a **separate Node.js process** (`npm run start:scheduler`) to keep cron execution completely isolated from the API server.

### `dailySnapshot.cron.js`

| Property | Value |
|---|---|
| Schedule | `0 1 * * *` — 1:00 AM |
| Timezone | `Asia/Kolkata` |
| Action | Adds a `daily-snapshot` job to the `daily-snapshot` queue |
| On queue failure | Writes a `QueueFail` doc with `nextRetryAt = now + 10 min` |

Lifecycle events (`execution:started`, `execution:finished`, `execution:failed`) are written to `SchedulerLog`. Every run is uniquely identified by `ctx.execution.id` (used as `runId`).

### `retryQueue.cron.js`

| Property | Value |
|---|---|
| Schedule | Every 1 minute |
| Action | Reads up to 50 `QueueFail` docs where `nextRetryAt ≤ now`, re-enqueues them |
| On success | Deletes the `QueueFail` doc |
| On re-enqueue failure | Increments `retryCount`, sets `nextRetryAt = now + 1 hour` |
| Guard | `isRunning` flag prevents overlapping executions |

---

## Socket.IO  (`src/sockets/socket.js`)

### Authentication

- **Client connections** — must supply the `accessToken` httpOnly cookie; verified via `jwt.verify()` at handshake
- **Worker connections** — authenticate by sending `{ service: "worker" }` in `socket.handshake.auth` (bypasses cookie check)

### Rooms

| Room name | Joined via event | Who joins |
|---|---|---|
| `tenant:{tenantId}:outlet:{outletId}` | `join_outlet` | Outlet Managers |
| `tenant:{tenantId}` | `join_tenant` | Brand Admins |

Membership is validated against `socket.user.tenantId` / `socket.user.outletId`. Cross-tenant join attempts are silently rejected.

### Events Reference

| Event | Direction | Description |
|---|---|---|
| `join_outlet` | Client → Server | Join the outlet-scoped room |
| `join_tenant` | Client → Server | Join the tenant-scoped room |
| `worker_emit` | Worker → Server | Internal relay — forwards `{ room, event, payload }` to a room |
| `stock_updated` | Server → Client | Stock level or alert state changed |
| `STOCK_MOVEMENT_CREATED` | Server → Client | New stock movement logged |
| `NEW_SALE` | Server → Client | New sale recorded |

---

## AWS Integration

Used exclusively by `csvExport.worker.js`.

| Operation | SDK package | Notes |
|---|---|---|
| Multipart stream upload | `@aws-sdk/lib-storage` `Upload` | Memory-efficient; no full file buffer |
| Pre-signed download URL | `@aws-sdk/s3-request-presigner` `getSignedUrl` | 7-day expiry |
| Object reference for presign | `@aws-sdk/client-s3` `GetObjectCommand` | |

CSV files are stored at: `reports/<reportType>_<tenantId>_<fromDate>_<toDate>_<timestamp>.csv`

> Credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`) are loaded from environment via `src/utils/config.js`.

---

## Services

| File | Responsibility |
|---|---|
| `cache.service.js` | Redis `get` / `set` / `del` wrappers; TTL-based response caching |
| `outletManagers.service.js` | Query helpers scoped to outlet-manager relationships |
| `stockRequirement.service.js` | Calculates per-ingredient base-unit requirements from a sale order + recipe |
| `stockValidator.service.js` | Validates that sufficient stock exists before confirming an order |

---

## Utilities

| File | Purpose |
|---|---|
| `config.js` | Loads & validates all env vars at boot; throws on missing required |
| `db.js` | `mongoose.connect()` wrapper used by the API server process |
| `redis.js` | Singleton `ioredis` client (shared by rate limiter, cache service) |
| `token.js` | JWT `sign` / `verify` helpers |
| `passport.js` | Passport JWT strategy — reads `accessToken` from signed cookie |
| `apiError.js` | `ApiError` class extending `Error` with `statusCode` and `errors[]` |
| `apiResponse.js` | Standardised success response shape `{ success, message, data }` |
| `asyncHandler.js` | Wraps async controller functions; auto-forwards thrown errors to Express error handler |
| `pagination.js` | Parallel `countDocuments` + `find` for paginated list responses |
| `mailer.js` | Nodemailer transporter factory (SMTP) |
| `emailAlert.js` | Pre-built email templates: CSV ready, CSV error |
| `alertState.js` | Computes `OK / LOW / CRITICAL` from stock quantity vs ingredient thresholds |

---

## Error Handling

Express global error handler in `app.js` catches all forwarded errors and returns:

```json
{
  "success": false,
  "message": "...",
  "errors": []
}
```

`ApiError` instances carry the `statusCode`; unrecognised errors default to `500`.

For async job failures, workers log to `QueueFail` after exhausting BullMQ retries — enabling recovery via the retry cron without operator intervention.
