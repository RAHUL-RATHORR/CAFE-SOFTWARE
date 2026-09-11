# DineFlow v1.0.0 Database Migration & Atlas Setup Plan

## 1. Pre-Migration Prerequisites
1. **Full Database Snapshot**: Trigger a cluster snapshot on MongoDB Atlas before running any initialization or schema index builds.
2. **Environment Validation**: Confirm all target environment variables (`MONGODB_URI`, `AUTH_SECRET`, `APP_ENV=production`) are provisioned via secrets manager.
3. **Atlas Network Peering & Whitelist**: Ensure outbound IP ranges of the application servers or VPC peering connections are whitelisted in Atlas Network Access.

---

## 2. Migration & Initialization Sequence

### Phase 1: Connection & Replica Set Handshake
- Verify connectivity to the MongoDB Atlas cluster using SRV connection string:
  ```text
  mongodb+srv://<username>:<password>@<cluster>.mongodb.net/dineflow_production?retryWrites=true&w=majority&appName=DineFlowProd
  ```
- Ensure connection pooling settings match production targets (`maxPoolSize=50`, `minPoolSize=10`, `serverSelectionTimeoutMS=5000`).

### Phase 2: Index Creation & Constraint Verification
Execute index synchronizations in the following order to avoid write contention:
1. **Core Tenant & Users**:
   - `restaurants`: `{ slug: 1 }` (unique)
   - `users`: `{ email: 1 }` (unique), `{ restaurantId: 1, role: 1 }`
2. **Branches & Tables**:
   - `branches`: `{ restaurantId: 1, name: 1 }`, `{ slug: 1 }`
   - `restauranttables`: `{ restaurantId: 1, branchId: 1, tableNumber: 1 }` (unique)
3. **Menu & Catalog**:
   - `categories`: `{ restaurantId: 1, displayOrder: 1 }`
   - `menuitems`: `{ restaurantId: 1, categoryId: 1, isAvailable: 1 }`
4. **Orders & Kitchen Operations**:
   - `orders`: `{ restaurantId: 1, branchId: 1, status: 1, createdAt: -1 }`
   - `orders`: `{ orderNumber: 1, restaurantId: 1 }`
5. **Billing & Financial Transactions**:
   - `bills`: `{ restaurantId: 1, invoiceNumber: 1 }` (unique sparse)
   - `bills`: `{ restaurantId: 1, branchId: 1, status: 1, createdAt: -1 }`
   - `payments`: `{ restaurantId: 1, billId: 1, status: 1 }`
6. **Inventory & Recipes**:
   - `ingredients`: `{ restaurantId: 1, branchId: 1, name: 1 }`
   - `recipes`: `{ restaurantId: 1, menuItemId: 1 }`
   - `stockmovements`: `{ restaurantId: 1, branchId: 1, ingredientId: 1, createdAt: -1 }`
7. **Daily Closings & Reports**:
   - `dailyclosings`: `{ restaurantId: 1, branchId: 1, closingDate: -1 }` (unique per date/branch)
   - `notificationmessagelogs`: `{ restaurantId: 1, status: 1, createdAt: -1 }`

---

## 3. Data Integrity & Validation Checks
- Run validation queries to guarantee no orphan documents exist without valid `restaurantId` references.
- Verify unique index constraints on `invoiceNumber` per tenant to eliminate any duplicate sequence race conditions.
- Confirm timezone alignment for daily closing aggregations (default UTC with restaurant-specific offsets).

---

## 4. Rollback Considerations
- **Non-Destructive Execution**: Index creation in DineFlow is non-destructive (`background: true` / rolling build in Atlas).
- **Abnormal Index Drop**: In the event of index build contention, drop problematic secondary indexes using `db.collection.dropIndex("index_name")`.
- **Database Restoration**: If data corruption occurs during manual seeding, restore from the pre-migration snapshot via the Atlas Console within minutes.
