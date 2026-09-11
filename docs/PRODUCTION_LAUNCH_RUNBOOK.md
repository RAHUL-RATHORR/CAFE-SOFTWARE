# DineFlow v1.0.0 Production Launch Runbook

## 1. Pre-Launch Verification Window (T - 2 Hours)

### Step 1.1: Secrets & Environment Audit
- Ensure secrets are loaded into the target deployment environment:
  - `AUTH_SECRET`: Strong 64-character entropy key.
  - `MONGODB_URI`: Production Atlas connection string with authenticated user.
  - `APP_ENV`: Set strictly to `"production"`.
  - `NODE_ENV`: Set strictly to `"production"`.
  - `NEXT_PUBLIC_APP_URL`: Production canonical domain (e.g. `https://app.dineflow.com`).
  - Notification Credentials: Live WhatsApp Cloud API, SendGrid/SES, and Twilio/SMS keys.

### Step 1.2: Atlas Pre-Flight Checks
- Atlas Cluster State: Primary node healthy, secondary replication lag < 1s.
- Backups: Verify continuous Atlas backup is active with automated point-in-time recovery.
- Network Whitelist: Ensure production deployment egress IPs have active rules.

### Step 1.3: Build & Artifact Validation
- Validate local production build passes without warning:
  ```bash
  npm run test
  npm run build
  ```

---

## 2. Launch Execution (T - 0)

1. **Deploy Production Release**:
   - Push release tag `v1.0.0` or trigger CI/CD pipeline to deploy production bundle.
2. **Verify Deployment Health**:
   - Execute HTTP GET request to canonical domain:
     ```bash
     curl -i https://app.dineflow.com/api/health
     curl -i https://app.dineflow.com/version
     ```
   - Confirm HTTP 200 OK with `status: "healthy"` and `version: "1.0.0"`.
3. **Verify TLS / SSL Certificate**:
   - Confirm SSL handshake is valid, HSTS is enforced, and rating is A+.
4. **Verify Domain Redirection**:
   - Confirm `http://` redirects cleanly to `https://`.
   - Confirm root domain redirects or serves canonical host.

---

## 3. Post-Launch Smoke Tests (T + 15 Minutes)

Perform live verification using a designated production test tenant (`DineFlow Validation Cafe`):
- [ ] **Auth**: Login as Owner, check session cookie attributes (`HttpOnly`, `Secure`, `SameSite=Lax`).
- [ ] **Onboarding / Dashboard**: Load main operational dashboard; verify summary cards render without delay.
- [ ] **Table QR**: Scan a designated test table QR code; ensure the menu catalog renders accurately on a mobile device.
- [ ] **QR Ordering**: Place a live test order from mobile QR view.
- [ ] **KDS Sync**: Verify the ticket immediately appears on the Kitchen Display screen.
- [ ] **POS Checkout**: Accept order on POS, apply a standard payment tender (Cash/Card/UPI), and finalize invoice.
- [ ] **GST Invoice**: Download or print the invoice; confirm CGST/SGST calculations and sequential invoice number.
- [ ] **Inventory Deduction**: Verify that recipe ingredients for the ordered item decremented from the stock balance.
- [ ] **Daily Closing**: Run a shift report check; ensure cash figures balance.
- [ ] **Logs**: Review application runtime logs; verify zero uncaught exceptions and no logged sensitive tokens.

---

## 4. Operational Sign-Off
- Once all smoke tests pass, communicate the successful v1.0.0 GA launch to stakeholders and support teams.
