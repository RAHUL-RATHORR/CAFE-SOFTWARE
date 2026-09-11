# DineFlow v1.0.0 Production Rollback Plan

## 1. Trigger Criteria for Rollback
A production rollback must be initiated immediately if any of the following P0/P1 conditions occur within 60 minutes post-deployment:
- **Authentication Failure**: Users cannot log in or sessions randomly terminate.
- **Tenant Cross-Leakage**: Any evidence of cross-tenant order, bill, or customer data visibility.
- **Payment & Invoicing Deadlock**: Failure to record payments or generate invoices.
- **Data Persistence Failure**: MongoDB connection dropouts or replica set write acknowledgment timeouts.
- **KDS Order Drop**: New orders submitted via POS or QR fail to propagate to kitchen screens.

---

## 2. Application Rollback Steps

### Option A: Hosting Provider Rollback (Vercel / Container Registry)
1. **Instant Rollback**: In the deployment dashboard (e.g., Vercel / Kubernetes), promote the previous stable release candidate (`v1.0.0-rc.1`) to the production alias.
2. **Purge Edge Cache**: Invalidate edge CDN and Next.js ISR caches.
3. **Verify Health**: Ping `/api/health` and verify `status: "healthy"` and expected previous build hash.

### Option B: Docker / Container Deployment
1. Re-tag previous container image:
   ```bash
   docker compose pull dineflow-app:previous
   docker compose up -d --no-deps app
   ```
2. Verify container logs:
   ```bash
   docker compose logs --tail=100 -f app
   ```

---

## 3. Database Considerations
- **Non-Destructive Guarantee**: Application code changes in v1.0.0 do not drop existing collections or rename legacy columns. Therefore, the database remains backwards-compatible with the pre-release codebase.
- **Never Run Destructive Rollbacks**: Do not drop tables or run blind database resets on production data.
- **Data Isolation Fixes**: In the unlikely event an index causes write contention, execute:
  ```javascript
  db.collection.dropIndex("problematic_index_name");
  ```
- **Point-in-Time Recovery (PITR)**: If data corruption occurred due to a code defect during deployment, use MongoDB Atlas PITR to restore to the timestamp immediately preceding the deployment window.

---

## 4. Post-Rollback Verification Checklist
- [ ] Ping `GET /api/health` ➔ Returns 200 OK
- [ ] Ping `GET /version` ➔ Returns stable version
- [ ] Log in as Restaurant Owner ➔ Dashboard displays correct metrics
- [ ] Submit test POS order ➔ KDS displays ticket correctly
- [ ] Customer support team notified and incident post-mortem scheduled
