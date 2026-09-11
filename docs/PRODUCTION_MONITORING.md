# DineFlow v1.0.0 Production Monitoring & Observability

## 1. Application-Level Metrics & Observability

### Health Checks
- **Endpoint**: `/api/health`
- **Cadence**: Every 30 seconds via external uptime monitor (e.g. BetterStack, Datadog, or Pingdom).
- **Thresholds**:
  - Response Code: `200 OK`
  - Response Time: `< 500ms`
  - Status Payload: `status == "healthy"` (aggregates environment, application, database, and telemetry state).

### Version Verification
- **Endpoint**: `/version`
- **Expected Status**: `200 OK`
- **Payload**:
  ```json
  {
    "name": "DineFlow",
    "version": "1.0.0",
    "buildId": "v1.0.0-release"
  }
  ```

### Performance & Latency Budgets
- **POS Order Placement**: `< 250ms` (P95)
- **KDS State Transition**: `< 150ms` (P95)
- **Dashboard Aggregate Query**: `< 600ms` (P95)
- **PDF Report Generation**: `< 2.5s` (P95)

---

## 2. Database (MongoDB Atlas) Monitoring

### Key Cluster Telemetry
- **CPU Utilization**: Alert when sustained `> 70%` for more than 5 minutes.
- **Memory (RAM) & WiredTiger Cache**: Ensure WiredTiger cache dirty percent `< 20%`.
- **Connections Pool**: Total open connections across all application instances `< 80%` of cluster limit.
- **Replication Lag**: Secondary replica lag `< 2 seconds`.
- **Slow Query Log**: Any query taking `> 100ms` should trigger an Atlas Profiler alert.

---

## 3. Business Telemetry & Anomaly Alerts

- **High Order Failure Rate**: Alert if `5xx` error rate on `/api/orders` exceeds `1%` in a 10-minute window.
- **Invoice Gap / Mismatch**: Automated integrity job flags any non-consecutive or failed invoice sequences.
- **Notification Drop Rate**: Alert if message log failure rate for WhatsApp or Email exceeds `5%`.
- **Inventory Discrepancies**: Log warnings when negative stock values occur on untracked stock deductions.

---

## 4. Log Aggregation & Security Audits

- **Structured JSON Format**: All server actions and API requests output JSON containing `timestamp`, `level`, `requestId`, `correlationId`, `service="DineFlow"`, and `operation`.
- **Masking & Redaction**: Built-in redaction filter scrubs `password`, `token`, `secret`, `authorization`, `cookie`, `mongodb_uri`, and `apiKey` from log streams.
- **Error Tracking**: Uncaught runtime errors log with sanitized stack traces and alert the on-call engineer.
