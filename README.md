<p align="center">
  <h1 align="center">🍳 Smart Kitchen Inventory Intelligence (SKII)</h1>
  <p align="center">
    <strong>A multi-tenant, event-driven restaurant inventory platform with real-time order processing, automated stock tracking, and pre-aggregated analytics.</strong>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white" />
    <img src="https://img.shields.io/badge/Express-v5-000000?style=for-the-badge&logo=express&logoColor=white" />
    <img src="https://img.shields.io/badge/React-v19-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
    <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
    <img src="https://img.shields.io/badge/Redis-ioredis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
    <img src="https://img.shields.io/badge/BullMQ-v5-F4821F?style=for-the-badge" />
    <img src="https://img.shields.io/badge/Socket.IO-v4-010101?style=for-the-badge&logo=socket.io&logoColor=white" />
    <img src="https://img.shields.io/badge/AWS_S3-SDK_v3-FF9900?style=for-the-badge&logo=amazons3&logoColor=white" />
  </p>
</p>

---

## Table of Contents

- [What is SKII?](#what-is-skii)
- [Role Architecture](#role-architecture)
- [System Architecture](#system-architecture)
- [Order Processing Pipeline — The Core Flow](#order-processing-pipeline--the-core-flow)
- [Tech Stack](#tech-stack)
- [Database — 15 Collections](#database--15-collections)
- [Why it is Designed This Way](#why-it-is-designed-this-way)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Running the Project](#running-the-project)

---

## What is SKII?

SKII is a **multi-tenant SaaS platform** for restaurant chains and cloud kitchens to manage ingredient inventory across multiple outlets. A single brand (`Tenant`) can operate many physical locations (`Outlets`), each with their own stock, staff, and order stream.

The hardest problem the system solves: **when a POS order arrives, multiple ingredients must be atomically deducted from stock, COGS must be computed per item, low-stock thresholds must be re-evaluated, affected managers must be emailed, and the dashboard must update in real-time — without blocking the HTTP response or losing data if any step fails.**

SKII solves this by splitting the work across a synchronous validation phase (fast, in-request) and an asynchronous processing phase (workers consuming a BullMQ queue).

---

## Role Architecture

| Role | Scope | What they can do |
|---|---|---|
| `SUPER_ADMIN` | Platform-wide | Create / delete tenants (brands), monitor cron scheduler logs |
| `BRAND_ADMIN` | One tenant | Manage outlets, menu items, ingredients, units, recipes, brand managers, analytics |
| `OUTLET_MANAGER` | One outlet | View stock, create restocks, view orders & movements. Access is gated by two flags: `RESTOCK` and `ANALYTICS` |

Outlet manager permissions are toggled individually per user by the brand admin via `PUT /api/v1/users/outlet-managers/:userId/permissions`.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT  (Vite + React 19)                      │
│                                                                             │
│   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────────┐    │
│   │   SuperAdmin App │   │  BrandAdmin App  │   │  OutletManager App   │    |
│   └──────────────────┘   └──────────────────┘   └──────────────────────┘    │
│        RTK Query (REST)       RTK Query (REST)      RTK Query + Socket.IO   │
└────────────────────────────────────┬────────────────────────┬───────────────┘
                                     │ REST /api/v1           │ WebSocket
┌────────────────────────────────────▼────────────────────────▼────────────────┐
│                          EXPRESS 5 — API SERVER  (app.js)                    │
│                                                                              │
│   Redis Rate Limiter ──► Passport JWT ──► Controllers ──► Services           │
│                                    │                                         │
│                         ┌──────────▼──────────┐                              │
│                         │    MongoDB Atlas     │  ← Mongoose 8 ODM           │
│                         └─────────────────────┘                              │
│                                    │                                         │
│   ┌────────────────────────────────▼──────────────────────────────────────┐  │
│   │                      BullMQ  Queues  (Redis)                          │  │
│   │   ┌──────────────┐   ┌─────────────────────┐   ┌──────────────────┐   │  │
│   │   │    orders    │   │   daily-snapshot    │   │   csv-export     │   │  │
│   │   └──────────────┘   └─────────────────────┘   └──────────────────┘   │  │ 
│   └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
              ↓  child_process.fork()  (npm run start:worker)
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                          WORKER  POOL  (startWorkers.js)                                 │
│                                                                                          │
│  4× order.worker.js  (concurrency 5 each = 20 parallel slots)                            │
│      sale.confirmed → processStockMovement + processSalesSnapshot + processAlerts        │
│      sale.failed    → processSalesSnapshot  (cancel record only)                         │
│                                                                                          │
│  1× dailySnapshot.worker.js  (concurrency 1)                                             │
│      Promise.allSettled → processDailySnapshot + processDailyItemSnapshot                │
│                                                                                          │
│  1× csvExport.worker.js                                                                  │
│      generateReportRows → fast-csv stream → S3 Upload → presign → email                  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
              ↓  separate process  (npm run start:scheduler)
┌───────────────────────────────────────────────────────────────────────────────┐
│                         SCHEDULER  PROCESS  (scheduler.js)                    │
│                                                                               │
│  dailySnapshot.cron  ── "0 1 * * *"   Asia/Kolkata  ── enqueue snapshot job   │
│  retryQueue.cron     ── every 1 min   ── re-enqueue QueueFail DLQ entries     │
└───────────────────────────────────────────────────────────────────────────────┘
```

```mermaid
graph TD
    subgraph Clients["CLIENTS (Vite + React 19)"]
        POS[("POS Device (Machine)")]
        UI[("Web UI (User)")]
    end

    subgraph External["External Services"]
        AWS[("AWS S3 Bucket")]
        Mail[("SMTP Server")]
    end

    subgraph Data["DATA PERSISTENCE"]
        Mongo[(MongoDB Atlas)]
        Redis[(Redis ioredis)]
    end

    subgraph MainApp["MAIN API SERVER (Express 5 - dev)"]
        Middlewares[Middlewares: Auth, RateLimit]
        Controllers[API Controllers]
        Services[Core Services]
        Sockets[Socket.IO Server]
        BullProducer[BullMQ Queue Producer]
    end

    subgraph WorkerPool["WORKER POOL (startWorkers.js)"]
        %% Fixed: Enclosed labels with parentheses in double quotes
        O_Worker["Order Workers (4x)"]
        S_Worker["Snapshot Worker (1x)"]
        C_Worker["CSV Export Worker (1x)"]
        BullConsumer[BullMQ Consumer]
    end

    subgraph SchedulerApp["SCHEDULER PROCESS (node-cron)"]
        Cron[node-cron Jobs]
    end

    %% Client Interactions
    POS -- "POST /sales (X-API-Key)" --> Controllers
    UI -- "JWT (httpOnly Cookie)" --> Middlewares
    UI -- "WebSocket" --> Sockets

    %% API Internals
    Middlewares --> Controllers
    Controllers --> Services
    Services --> BullProducer
    Sockets -- "Broadcasts" --> UI

    %% Data Connections
    Controllers <--"Mongoose 8"--> Mongo
    Services <--"ioredis"--> Redis
    BullProducer -- "Job Persistence" --> Redis
    WorkerPool -- "Job Data" --> Redis
    Cron -- "Logs" --> Mongo

    %% Process Connections
    SchedulerApp -- "Enqueues cron jobs" --> Redis
    Redis -- "Dispatch Jobs" --> BullConsumer

    %% Worker Actions
    O_Worker -- "Update Stocks" --> Mongo
    O_Worker -- "Socket Emit" --> Sockets
    S_Worker -- "Read Sales / Write Snapshots" --> Mongo
    C_Worker -- "Read" --> Mongo
    C_Worker -- "Fast-CSV Stream" --> Pass[PassThrough]
    Pass --> AWS
    O_Worker -- "Send Stock Alert" --> Mail
    C_Worker -- "Email with presigned URL" --> Mail
```

### The Three Independent Processes

```bash
npm run dev              # 1. API Server   — HTTP + WebSocket
npm run start:worker     # 2. Worker Pool  — BullMQ consumers (6 forked processes)
npm run start:scheduler  # 3. Scheduler   — node-cron jobs (2 crons)
```

Keeping these separate means cron jitter or a slow snapshot job can **never** delay an HTTP response, and a crashing worker is **auto-restarted** without affecting the API.

---

## Order Processing Pipeline — The Core Flow

This is what happens from the moment a POS device sends `POST /api/v1/sales`:

```mermaid
sequenceDiagram
    autonumber

    actor POS
    participant API
    participant Redis
    participant DB
    participant Queue
    participant Worker
    actor Manager

    Note over POS,API: Phase 1 — Fast synchronous request

    POS->>API: POST /sales
    API->>API: Validate tenant & outlet

    API->>Redis: Get recipes (mget)

    alt Cache miss
        Redis-->>API: Miss
        API->>DB: Fetch recipes
        API->>Redis: Cache recipes (24h)
    else Cache hit
        Redis-->>API: Recipes
    end

    API->>API: Calculate required ingredients

    API->>DB: Check stock (bulk query)

    alt Stock insufficient
        API->>DB: Mark sale CANCELED
        API-->>POS: 400 Error
    else Stock sufficient

        Note over API,DB: MongoDB Transaction

        API->>DB: Bulk stock deduction ($inc)
        API->>API: OCC retry (max 5)

        API->>Queue: Add job sale.confirmed
        API-->>POS: 200 OK
    end

    Note over Queue,Worker: Phase 2 — Async processing

    Queue->>Worker: Consume sale.confirmed

    Worker->>Worker: processStockMovement()
    Worker-->>API: Emit STOCK_MOVEMENT_CREATED

    Worker->>Worker: processSalesSnapshot()
    Worker-->>API: Emit NEW_SALE

    Worker->>DB: processAlerts()
    Worker->>Worker: Evaluate alert state

    Worker->>DB: Update alert state (guarded)

    alt State changed
        Worker->>DB: Fetch manager emails
        Worker->>Manager: Send alert email
    else No change
        Worker->>Worker: Skip email
    end
```
### Phase 1 — Synchronous (inside the HTTP request)

```
1. validateTenant()        — Look up Tenant by tenantId (404 if not found)
2. validateOutlet()        — Ensure outlet belongs to that tenant
3. createPendingSale()     — Insert Sale document with state="PENDING"
                             Items resolved to itemNames via MenuItem lookup
4. loadRecipeMap()         — For each unique itemId:
     └─ Redis mget() batch ─► cache HIT  → use cached recipe (TTL 24h)
                             ─► cache MISS → load from MongoDB,
                                             write back to Redis (write-through)
5. buildStockRequirement() — Multiply recipe.baseQty × order item qty
                             Aggregate across all items in the order
6. validateStock()         — One MongoDB query: find all relevant Stock docs
                             For each ingredient: current >= required?
                               FAIL → push to failed[], mark isValid=false
7a. isValid == false       → cancelSaleAndRespond():
                             Update Sale state="CANCELED" + cancelIngredientDetails
                             Return 400 immediately
7b. isValid == true        → deductStockWithTransaction():
                             MongoDB session.startTransaction()
                             bulkWrite with guard: currentStockInBase >= required
                             $inc: -requiredBaseQty per ingredient
                             OCC conflict → retry up to MAX_RETRIES=5
                             with jittered exponential backoff
8. Enqueue job to BullMQ "orders" queue  (sale.confirmed or sale.failed)
9. Return 200 to POS
```

### Phase 2 — Asynchronous (inside order.worker.js)

The worker picks up the queued job and runs three processors sequentially:

```
job: sale.confirmed
│
├─ processStockMovement()
│    For each ingredient in requirementList:
│      findOneAndUpdate with $setOnInsert + upsert=true  (idempotent)
│      Creates StockMovement doc (reason="ORDER")
│      Emits "STOCK_MOVEMENT_CREATED" via Socket.IO to outlet room
│
├─ processSalesSnapshot()
│    Loads MenuItem + Recipe + Stock in parallel (Promise.all)
│    Computes totalAmount = price × qty per item
│    Computes makingCost = sum(ingredient baseQty × unitCost) per item
│    Updates Sale state="CONFIRMED" with final financials
│    Emits "NEW_SALE" via Socket.IO to outlet room
│
└─ processAlerts()
     Loads Stock + IngredientMaster in parallel
     resolveAlertState() per ingredient:
       currentStockInBase <= criticalInBase → "CRITICAL"
       currentStockInBase <= lowInBase      → "LOW"
       else                                 → "OK"
     bulkWrite only where alertState actually changed
     (optimistic: filter by prevState prevents lost-update)
     If any state changed → fetch outlet manager emails
                         → sendStockAlertEmail()
```

### Phase 3 — Failure Recovery

```
BullMQ retries failed jobs: 5 attempts, exponential backoff starting at 1s
After 5 exhausted attempts → worker writes QueueFail document
  { eventType, payload, lastError, status: "investigate", source: "worker" }

retryQueue.cron runs every minute:
  - Finds QueueFail docs where nextRetryAt <= now (up to 50 per run)
  - Re-enqueues each into the correct queue
  - On success: deletes the QueueFail doc
  - On failure: retryCount++, nextRetryAt = now + 1 hour

If the cron itself fails to enqueue (e.g. Redis down):
  dailySnapshot.cron writes its own QueueFail with nextRetryAt = now + 10 min
```

---

## Tech Stack

### Backend

| Package | Version | What it does in this project |
|---|---|---|
| `express` | v5 | HTTP server, routing, global error handler |
| `mongoose` | v8 | ODM — schemas, compound indexes, aggregation pipelines, transactions |
| `bullmq` | v5 | Job queues with retries, backoff, concurrency control |
| `ioredis` | v5 | Redis client — cache, rate limiting store, queue backbone |
| `node-cron` | v4 | Two scheduled jobs (daily snapshot + DLQ retry) |
| `socket.io` | v4 | Real-time bi-directional events; JWT auth at handshake |
| `passport` / `passport-jwt` | v0.7 / v4 | JWT strategy reading from httpOnly cookie |
| `jsonwebtoken` | v9 | Sign + verify tokens |
| `bcrypt` | v6 | Password hashing (salt rounds applied at save) |
| `express-rate-limit` | v8 | Three-tier rate limiting middleware with memory fallback |
| `rate-limit-redis` | v4 | Redis backing store for rate limiter (distributed) |
| `opossum` | v7 | Circuit breaker wrapping Redis cache operations |
| `@aws-sdk/client-s3` | v3 | S3 object commands |
| `@aws-sdk/lib-storage` | v3 | Streaming multipart upload — no temp files |
| `@aws-sdk/s3-request-presigner` | v3 | Pre-signed download URLs (7-day expiry) |
| `fast-csv` | v5 | Streaming CSV write with BOM — piped to S3 |
| `nodemailer` | v7 | SMTP email — OTP delivery + stock alerts + CSV export links + Redis down alerts |
| `multer` | v2 | Multipart file upload handling for CSV imports |
| `uuid` | v13 | Unique ID generation |
| `cookie-parser` | v1 | Parse signed cookies (accessToken) |
| `cors` | v2 | Configured CORS with credentials |
| `morgan` | v1 | HTTP request logging (tiny format) |
| `dotenv` | v17 | Env config; validated in `config.js` at boot |
| `nodemon` | v3 | Dev auto-restart |

### Frontend

| Package | Version | What it does in this project |
|---|---|---|
| `react` / `react-dom` | v19 | UI framework |
| `vite` | v7 | Build tool + dev server with HMR |
| `react-router-dom` | v7 | Client-side routing; role-based app shell switching |
| `@reduxjs/toolkit` | v2 | Store + RTK Query (all API calls, cache, tag invalidation) |
| `react-redux` | v9 | React bindings for Redux |
| `tailwindcss` | v4 | Utility-first CSS |
| `@radix-ui/*` | various | Accessible UI primitives (dialog, select, dropdown…) |
| `class-variance-authority` | v0.7 | Variant-based className management |
| `tailwind-merge` | v3 | Safe class merging (`cn()` helper) |
| `@tanstack/react-table` | v8 | Headless table — sort + pagination client-side |
| `recharts` | v2 | Bar + line charts for analytics pages |
| `socket.io-client` | v4 | WebSocket client; custom hooks for each event type |
| `sonner` | v2 | Toast notifications (success, error, rate-limit warning) |
| `papaparse` | v5 | CSV parsing in the browser before upload |
| `axios` | v1 | HTTP client (used alongside RTK Query for some ad-hoc calls) |
| `lottie-react` | v2 | Lottie JSON animation player (empty states) |
| `date-fns` | v4 | Date arithmetic + formatting for analytics date range picker |
| `lodash` | v4 | Utility functions |
| `lucide-react` | v0.56 | Icon library |

---

## Database — 15 Collections

The data model uses **denormalised multi-tenancy**: every document embeds `{ tenantId, tenantName }` and (where applicable) `{ outletId, outletName }`. This avoids `$lookup` joins and lets compound indexes cover all common query shapes.

```mermaid

erDiagram
    %% Core Entities
    Tenants {
        ObjectId _id
        String name
    }

    Users {
        ObjectId _id
        String email
        String role
        Map permissions
        Ref tenant
        Ref outlet
    }

    Outlets {
        ObjectId _id
        String outletName
        Ref tenant
    }

    %% Master Data & Recipes
    Units {
        ObjectId _id
        String unit
        String baseUnit
        Number conversionRate
        Ref tenant
    }

    IngredientMasters {
        ObjectId _id
        String name
        Map thresholds
        Array unitMappings
        Ref tenant
    }

    MenuItems {
        ObjectId _id
        String itemName
        Number price
        Ref tenant
    }

    Recipes {
        ObjectId _id
        Ref item
        Array recipeItems
        Ref tenant
    }

    %% Active Inventory & Orders
    Stocks {
        ObjectId _id
        Ref masterIngredient
        String alertState
        Number currentStockInBase
        Ref tenant
        Ref outlet
    }

    StockMovements {
        ObjectId _id
        Ref stockId
        String reason
        Number quantity
        Ref orderId
        Ref tenant
        Ref outlet
    }

    Sales {
        ObjectId _id
        String externalOrderId
        String state
        Array items
        Array cancelDetails
        Ref tenant
        Ref outlet
    }

    %% Analytics & Logs
    TenantDailySnapshots {
        Date date
        Number cogs
        Number totalSale
        Ref tenant
    }

    OutletItemDailySnapshots {
        Date date
        Number totalQty
        Ref item
        Ref tenant
        Ref outlet
    }

    SchedulerLogs {
        String eventType
        String status
    }

    QueueFails {
        String eventType
        Map payload
        String status
    }

    POSApiKeys {
        ObjectId _id
        String apiKeyHash
        Boolean isActive
        Map createdBy
        Ref tenant
        Ref outlet
    }

    %% Relationships based on document structure
    Tenants ||--o{ Outlets : "owns"
    Tenants ||--o{ Users : "employs (BrandAdmin)"
    Outlets ||--o{ Users : "employs (OutletMgr)"

    %% Denormalized Data Flows / Dependencies
    IngredientMasters }o--o{ Units : "references conversions"
    Recipes ||--|| MenuItems : "for specific item"
    Recipes }o--|| IngredientMasters : "uses ingredients"
    Stocks }o--|| IngredientMasters : "specific ingredient stock"
    StockMovements }o--|| Stocks : "belongs to stock"
    StockMovements }o--|| Sales : "belongs to sale"
    Sales }o--o{ MenuItems : "sold items"
    OutletItemDailySnapshots }o--|| MenuItems : "snapshot of item"
    POSApiKeys }o--|| Outlets : "scoped to outlet"
    POSApiKeys }o--|| Tenants : "scoped to tenant"

```

### Tenants

```
_id, name (unique), createdAt, updatedAt
```

### Users

```
_id
tenant        { tenantId, tenantName }  — null for SUPER_ADMIN
outlet        { outletId, outletName }  — null unless OUTLET_MANAGER
userName
email         (unique)
password      (bcrypt, select:false)
role          SUPER_ADMIN | BRAND_ADMIN | OUTLET_MANAGER
emailVerified
otpHash, otpExpiresAt, otpPurpose   (SIGNUP | FORGOT_PASSWORD)
outletManagerPermissions { RESTOCK: bool, ANALYTICS: bool }
```

### Outlets

```
_id
tenant        { tenantId, tenantName }
outletName
address       { line, city, state, country, pincode }
```
Index: `(tenant.tenantId, createdAt: -1)`

### IngredientMasters

```
_id
tenant        { tenantId, tenantName }
name
threshold     { lowInBase, criticalInBase, unit: { unitId, unitName, baseUnit, conversionRate } }
unit[]        [{ unitId, unitName, baseUnit, conversionRate }]
```

### Units  (BaseUnit)

```
_id
tenant        { tenantId, tenantName }
unit          — display name  e.g. "kg"
baseUnit      — storage unit  e.g. "g"
conversionRate — multiplier (1 kg = 1000 g → conversionRate: 1000)
```

### MenuItems

```
_id
tenant        { tenantId, tenantName }
itemName
price
```
Indexes: `(tenant.tenantId, itemName)`, `(tenant.tenantId, createdAt: -1)`

### Recipes

```
_id
tenant        { tenantId, tenantName }
item          { itemId, itemName }
recipeItems[] { ingredientMasterId, ingredientName, baseQty, unit, qty }
              — must have at least 1 item (validated)
```

### Stocks

```
_id
tenant        { tenantId, tenantName }
outlet        { outletId, outletName }
masterIngredient { ingredientMasterId, ingredientMasterName }
baseUnit
currentStockInBase   — always stored in base unit
unitCost             — cost per base unit (used for COGS calculation)
alertState    OK | LOW | CRITICAL
```
Index: `(outlet.outletId, masterIngredient.ingredientMasterId)`

### StockMovements

```
_id
tenant, outlet, ingredient  — embedded refs
quantity     — negative for consumption
unit
reason       ORDER | PURCHASE | POSITIVE_ADJUSTMENT | NEGATIVE_ADJUSTMENT
orderId      — present for ORDER movements (links to Sale)
stockId      — ref to Stock doc
unitCost     — snapshot of cost at time of movement
```

### Sales

```
_id
tenant, outlet  — embedded
orderId         — external POS order ID
state           PENDING → CONFIRMED | CANCELED | PARTIAL
items[]
  itemId, itemName, qty
  totalAmount   — price × qty  (0 while PENDING, set by worker)
  makingCost    — COGS per item (0 while PENDING, set by worker)
  cancelIngredientDetails[]  { ingredientMasterId, requiredQty, availableStock, issue }
```

### TenantDailySnapshots

```
tenant, outlet  — embedded
date            — normalised to UTC midnight (setUTCHours 0,0,0,0)
totalSale       — sum of confirmed order revenue
confirmedOrders, canceledOrders
cogs            — sum of confirmed order making costs
```
Index: `(tenant.tenantId, date)`

### OutletItemDailySnapshots

```
tenant, outlet, item  — embedded
date
totalQty, totalRevenue, totalMakingCost
```
Indexes: `(tenant.tenantId, date)`, `(tenant.tenantId, outlet.outletId, date)`

### SchedulerLogs

```
eventType  e.g. "daily-snapshot"
status     started | success | failed
runId      — node-cron ctx.execution.id (upsert key)
startTime, endTime, duration (ms)
error, details
```

### QueueFails  (Dead-Letter Store)

```
eventType
payload         — original job data
retryCount
lastError
nextRetryAt     — when the retry cron should try again
status          pending_retry | investigate
source          scheduler | worker
```

### POSApiKeys

```
_id
apiKeyHash      — bcrypt hash (select:false)
tenant          { tenantId, tenantName }
outlet          { outletId, outletName }
isActive        — revocation flag
createdBy       { userId, userEmail }
description     — optional label set at generation time
```
Index: `(outlet.outletId, isActive)`

---

## Why it is Designed This Way

### 1. Redis Write-Through Recipe Cache

Recipes are read on every order but change rarely. The `loadRecipeMap()` function in `sale.controller.js`:

1. Builds cache keys: `tenant:{tenantId}:recipe:{itemId}` for all unique item IDs
2. Fires a single `redis.mget(keys)` — one round-trip for all recipes
3. For any cache miss, queries MongoDB and immediately writes back to Redis (`TTL: 24 hours`)
4. When a recipe is updated, `cacheService.delByPattern()` uses `ioredis.scanStream()` to find and pipeline-delete all matching keys

This keeps recipe loading at ~1 ms (cache hit) instead of a MongoDB query per item, and keeps the cache coherent after writes.

### 2. MongoDB Transactions + OCC for Stock Deduction

`deductStockWithTransaction()` in `sale.controller.js` runs a `session.startTransaction()` → `bulkWrite` with a guard clause:

```js
filter: {
  "outlet.outletId": outletId,
  "masterIngredient.ingredientMasterId": ingredientId,
  currentStockInBase: { $gte: requiredBaseQty }  // ← the OCC guard
}
update: { $inc: { currentStockInBase: -requiredBaseQty } }
```

If two orders arrive simultaneously for the same ingredient, one will see `modifiedCount < requirementList.length` and retry. Up to `MAX_RETRIES = 5` times with sleep-based backoff. This prevents overselling without using pessimistic locks that would serialise all requests.

### 3. Idempotent Workers via `$setOnInsert`

Every processor uses `findOneAndUpdate` with `upsert: true` and `$setOnInsert`. If BullMQ retries a job (because the worker crashed mid-flight), the second run is a no-op — no duplicate `StockMovement` records. This makes the entire pipeline exactly-once from the data perspective.

### 4. Alert Processor with Optimistic State Guard

`processAlerts()` loads stock and ingredient in `Promise.all`, evaluates the new alert state, then does:

```js
Stock.bulkWrite([{
  updateOne: {
    filter: { _id: item.stockId, alertState: item.prevAlert },  // ← guard
    update: { $set: { alertState: item.alertState } }
  }
}])
```

The `alertState: prevAlert` guard prevents a race condition where two workers evaluate the same stock simultaneously — only one write lands. If `modifiedCount === 0` the email is skipped entirely, preventing duplicate alerts.

### 5. Streaming CSV Export — No Temp Files, No Memory Spike

The `csvExport.worker.js` never buffers the full CSV in memory. It connects three streams:

```
generateReportRows() async generator
   → csvFormat({ headers: true })    (fast-csv write stream)
   → PassThrough
   → Upload({ Body: passThrough })   (AWS SDK multipart upload)
```

Rows are yielded one at a time; `fast-csv` applies backpressure (`csvStream.once("drain")` when write returns false). The upload uploads parts as the stream fills them. The process RAM footprint is constant regardless of report size.

### 6. Pre-Aggregated Snapshots for Analytics

Every analytics query that asks "how did this outlet perform from date A to date B?" reads from `TenantDailySnapshot` or `OutletItemDailySnapshot` — documents pre-computed by the nightly cron. The aggregation pipeline uses:

- `$dateTrunc` to normalise order timestamps to day boundaries
- `$group` on `(day, outletId)` to sum revenue, COGS, and order counts
- Bulk upsert inside a transaction per tenant

The "live" report endpoints (`/reports/deployment-live`, `/reports/item-live`) skip snapshots and aggregate directly from `Sales` — useful for today's in-progress data.

### 7. Distributed Rate Limiting with Memory Fallback

All three `rateLimit()` instances use a `DynamicRateLimitStore` that normally delegates to `RedisStore` but falls back to an in-memory `MemoryStore` if the Redis connection is unavailable:

| Limiter | Window | Max | Key |
|---|---|---|---|
| `generalRateLimit` | 1 min | 1 000 req | `rl:general:` + user `_id` or IP |
| `authRateLimit` | 10 min | 20 req | `rl:auth:` + IP |
| `csvRateLimit` | 5 min | 5 req | `rl:csv:` + user `_id` or IP |

When Redis is healthy, counters are shared across all horizontal replicas. When Redis is down, each process falls back to in-process counting — rate limiting is still enforced, just not shared across instances.

### 8. Per-Role Redis Connection Profiles (`RedisManager`)

Instead of a single shared `ioredis` client, a `RedisManager` class manages connections with distinct profiles per role:

| Role | Used by | Key settings |
|---|---|---|
| `CACHE` | `cache.service.js` | `maxRetriesPerRequest=0`, `enableOfflineQueue=false`, instant fail-fast |
| `RATE_LIMIT` | `rateLimiter.middleware.js` | `maxRetriesPerRequest=null`, reconnection backoff |
| `QUEUE_PRODUCER` | BullMQ queue producers | `maxRetriesPerRequest=0`, `enableOfflineQueue=false` |
| `WORKER` | Snapshot + CSV workers | `maxRetriesPerRequest=null`, long-lived |
| `ORDER_WORKER` | Order workers | `maxRetriesPerRequest=null`, dedicated per fork |

CACHE and RATE_LIMIT roles share singleton connections; all other roles get a new connection per caller. The manager also fires `sendRedisDownAlertEmail()` on first connection error, ensuring ops are alerted immediately.

### 9. Circuit Breaker on Redis Cache (`opossum`)

`cache.service.js` wraps every Redis operation in a `cacheBreaker` (powered by `opossum`). Configuration:

- **timeout**: 3 s per operation
- **errorThresholdPercentage**: 50 % — circuit opens after half the calls fail
- **resetTimeout**: 30 s — half-open probe after 30 s
- **volumeThreshold**: 5 calls before statistics start

When the circuit is open, all cache reads/writes silently return `null`/`undefined`. The sale pipeline continues — each recipe is loaded from MongoDB instead. This prevents a Redis outage from cascading into HTTP 500s for incoming POS orders.

### 10. Socket.IO Room-Based Broadcasting

The server maintains two room patterns:
- `tenant:{tenantId}:outlet:{outletId}` — joined by outlet managers via `join_outlet`
- `tenant:{tenantId}` — joined by brand admins via `join_tenant`

Workers don't hold a Socket.IO server reference. Instead they connect as a client with `{ auth: { service: "worker" } }`, bypassing JWT cookie auth, and emit `worker_emit` with `{ room, event, payload }`. The server's `worker_emit` handler calls `io.to(room).emit(event, payload)` — forwarding to all real clients in that room.

Room membership is validated at join time by checking `socket.user.tenantId === tenantId` and `socket.user.outletId === outletId`. A cross-tenant join attempt is silently dropped.

---

## Key Features

### Inventory Operations
- Real-time stock levels per ingredient per outlet, stored in base units
- Three alert states: `OK → LOW → CRITICAL` based on configurable thresholds
- Automatic alert state re-evaluation after every order
- Email notification to all outlet managers when an ingredient crosses a threshold
- Full immutable audit log of all stock changes (`StockMovement` collection)
- Bulk restock via CSV upload + client-side validation

### Order & Sales
- POS-friendly `POST /sales` endpoint secured with a per-outlet API key (`X-API-Key` header)
- Brand admins generate / revoke POS API keys per outlet via `/api/v1/pos-api-keys`
- Atomic multi-ingredient stock deduction in a single MongoDB transaction
- Per-item COGS (`makingCost`) computed in the worker and stamped onto the Sale
- Partial order support: some items confirmed, others canceled if stock insufficient
- Cancel details record exactly which ingredient was missing and by how much

### Menu & Recipe Management
- Multi-unit ingredients — define `kg`, `g`, `litre`, `ml` with conversion rates
- Recipes link menu items to ingredients with per-unit quantities
- Bulk create menu items, ingredients, and recipes via CSV
- Recipe update invalidates all related Redis cache keys instantly

### Analytics
- Deployment-level (outlet) snapshot and live reports with revenue, COGS, order counts
- Item-level snapshot and live reports with qty, revenue, making cost
- Menu Engineering Matrix: popularity (qty sold) vs profitability (margin) quadrant classification
- Ingredient burn rate report
- Async CSV export of any report type — streamed to S3, download link emailed

### Platform
- OTP-based user invitation for brand managers and outlet managers
- OTP-based password reset
- Granular outlet manager permissions (toggle `RESTOCK` and `ANALYTICS` independently)
- Cron execution audit trail visible in the Super Admin UI
- Dead-letter queue with automatic retry — no permanently lost jobs
- Redis health monitoring with automatic email alerts on connection failure
- Circuit breaker on Redis cache — graceful degradation, no cascading failures
- POS API key lifecycle management (generate, describe, revoke) per outlet

---

## Project Structure

```
InventoryManagementSystem/
│
├── client/                         # React 19 SPA (Vite 7)
│   └── src/
│       ├── App.jsx                 # Role-based app switcher
│       ├── apps/                   # One shell per role
│       │   ├── super-admin/
│       │   ├── brand-admin/
│       │   └── outlet-admin/
│       ├── auth/                   # AuthContext, useAuth, ProtectedRoute
│       ├── pages/                  # Page components per role
│       ├── components/             # Shared UI (shadcn/ui + custom)
│       │   ├── ui/                 # Radix-based primitives
│       │   ├── common/             # CsvScanner, ConfirmModal
│       │   ├── charts/             # Recharts wrappers
│       │   └── data-card/          # TanStack Table wrapper
│       ├── redux/
│       │   ├── store.js
│       │   ├── apis/               # RTK Query per-resource slices + baseApi
│       │   └── reducers/           # dashboardFilters, stockSlice
│       ├── routes/                 # Route config arrays (brand / outlet / super)
│       ├── sockets/                # Socket.IO client + useStockSocket etc.
│       └── utils/                  # render-routes, csv.validator, columns
│
├── server/                         # Express 5 API
│   ├── app.js                      # Bootstrap: DB, CORS, Socket.IO, routes, error handler
│   └── src/
│       ├── scheduler.js            # Scheduler process entry point
│       ├── controllers/            # 14 controllers (one per resource)
│       ├── routes/                 # 15 Express routers + index.js
│       ├── models/                 # 15 Mongoose models
│       ├── middlerwares/
│       │   ├── auth.middleware.js        # verifyJwt — Passport JWT
│       │   ├── rateLimiter.middleware.js # general / auth / csv (dynamic Redis+memory store)
│       │   └── verifyPOSApiKey.middleware.js  # X-API-Key header validation for POST /sales
│       ├── services/
│       │   ├── cache.service.js    # Redis get/set/mget/delByPattern (TTL 24h)
│       │   ├── stockRequirement.service.js
│       │   └── stockValidator.service.js
│       ├── queues/
│       │   ├── order.queue.js      # "orders" — 5 attempts, exp backoff
│       │   ├── dailySnapshot.queue.js
│       │   └── csvExport.queue.js
│       ├── workers/
│       │   ├── startWorkers.js     # Forks 4 order + 1 snapshot + 1 csv workers
│       │   ├── order.worker.js     # concurrency:5; handles sale.confirmed / sale.failed
│       │   ├── dailySnapshot.worker.js  # concurrency:1; parallel snapshot processors
│       │   ├── csvExport.worker.js # stream → S3 → presign → email
│       │   └── socket.js           # Worker-side Socket.IO client (worker_emit)
│       ├── proccessors/
│       │   ├── stockMovement.processor.js   # idempotent upsert + socket emit
│       │   ├── salesSnapshot.processor.js   # COGS calc + Sale update + socket emit
│       │   ├── proccessAlerts.processor.js  # threshold eval + bulkWrite + email
│       │   ├── dailySnapshot.processor.js   # tenant-level daily aggregation
│       │   ├── dailyItemSnapshot.processor.js
│       │   └── csvExport.processor.js       # async row generator for reports
│       ├── crons/
│       │   ├── dailySnapshot.cron.js  # "0 1 * * *" Asia/Kolkata
│       │   └── retryQueue.cron.js     # every 1 min, 50 entries/run, isRunning guard
│       ├── sockets/
│       │   └── socket.js           # Socket.IO init, JWT auth middleware, rooms
│       └── utils/
│           ├── config.js           # Env validation (throws on missing required)
│           ├── db.js               # mongoose.connect()
│           ├── redis/
│           │   ├── redisManager.js # RedisManager class — per-role connections + health alerts
│           │   └── redisProfiles.js # ioredis option profiles (CACHE, RATE_LIMIT, WORKER…)
│           ├── circuitBreaker.js   # opossum cacheBreaker wrapping Redis cache ops
│           ├── token.js            # JWT sign/verify
│           ├── passport.js         # passport-jwt strategy (cookie extraction)
│           ├── apiError.js         # ApiError class
│           ├── apiResponse.js      # Standard response shape
│           ├── asyncHandler.js     # Async controller wrapper
│           ├── pagination.js       # Parallel count + find
│           ├── alertState.js       # resolveAlertState() pure function
│           ├── mailer.js           # Nodemailer transporter factory
│           └── emailAlert.js       # Email templates (OTP, alert, CSV export, Redis down)
│
├── orders/                         # Order load simulator
│   ├── index.js                    # Fires concurrent POST /sales (with POS API keys) across outlets
│   ├── simulator.html              # Browser-based order simulator for stress testing
│   └── dailysnapshot.js
│
└── docs/                           # Architecture diagrams
```

---

## Running the Project

### Prerequisites

- Node.js v20+
- MongoDB Atlas (replica set required for multi-document transactions) or local `mongod --replSet`
- Redis (Upstash, Redis Cloud, or local)
- AWS S3 bucket with IAM credentials that have `s3:PutObject` + `s3:GetObject`
- SMTP credentials (Gmail App Password, SendGrid, etc.)

### 1. Clone

```bash
git clone <repo-url>
cd InventoryManagementSystem
```

### 2. Configure the server

```bash
cd server
npm install
cp .env.backup .env   # fill in values
```

Required `.env` keys:

```env
PORT=8000
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/SKII
REDIS_URI=redis://default:pass@host:port
ACCESS_TOKEN_SECRET=change_me_to_a_long_random_string
ACCESS_TOKEN_EXPIRY=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your_app_password
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=ap-south-1
AWS_S3_BUCKET=skii-exports
CLIENT_URL=http://localhost:5173
```

### 3. Run all three server processes

```bash
# Terminal 1 — API server
cd server && npm run dev

# Terminal 2 — Worker pool (6 child processes)
cd server && npm run start:worker

# Terminal 3 — Cron scheduler
cd server && npm run start:scheduler
```

### 4. Run the client

```bash
cd client && npm install && npm run dev
# → http://localhost:5173
```

### 5. (Optional) Load test

Before running the order simulator, generate a POS API key for each outlet via the Brand Admin dashboard (or `POST /api/v1/pos-api-keys/generate`) and set them in `orders/index.js`.

```bash
cd orders && npm install && node index.js
# Fires concurrent orders (with X-API-Key header) across multiple outlets
```

Alternatively, open `orders/simulator.html` in a browser for an interactive stress-testing UI.

---

<p align="center">
  Built from scratch with Node.js, React, MongoDB, Redis, BullMQ, and Socket.IO
</p>
