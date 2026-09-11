# DineFlow v1.0.0 Customer Support Runbook

This guide is for Tier 1 and Tier 2 Support engineers resolving frontline restaurant operational issues.

---

## 1. Issue: "Cannot Log In to Restaurant Account"
- **Symptoms**: Error message "Invalid email or password", "Account suspended", or infinite redirect to login.
- **First Checks**:
  1. Confirm the user is using the correct restaurant email address.
  2. Verify if the restaurant subscription status is `ACTIVE` or `TRIAL`.
  3. Check if `mustChangePassword` is set (redirects to `/first-login`).
- **Likely Cause**: Typo in credentials, expired subscription, or pending password reset.
- **Safe Resolution**:
  - Direct the user to the self-service "Forgot Password" flow (`/forgot-password`).
  - If the user account was locked due to rate limiting, wait 5 minutes for the rate limit window to expire.
- **Escalation**: Escalate to Tier 2 if the user's password reset token fails or session cookie cannot be set.

---

## 2. Issue: "Customer QR Code Not Loading Menu"
- **Symptoms**: QR scan opens browser, but displays "Table not found", "Restaurant unavailable", or blank page.
- **First Checks**:
  1. Check if the table status is marked `ACTIVE` in Table Management.
  2. Verify the branch is marked `OPEN` and operational hours allow orders.
  3. Confirm the URL format: `https://<domain>/menu?restaurant=<slug>&table=<number>`.
- **Likely Cause**: Inactive table, newly regenerated QR code while old sticker remains on table, or branch closed.
- **Safe Resolution**:
  - Re-enable table in Table Management.
  - Re-print the current QR code from the Admin/Manager dashboard.
- **Escalation**: Escalate if the QR route returns 500 error or database lookup fails.

---

## 3. Issue: "New Orders Not Appearing on Kitchen Display (KDS)"
- **Symptoms**: Cashier takes order or customer places QR order, but KDS screen doesn't update.
- **First Checks**:
  1. Verify the KDS browser has an active Internet connection.
  2. Check if the KDS is filtered to the correct Branch and Kitchen Station.
  3. Refresh the KDS page to test polling fallback.
- **Likely Cause**: WebSocket disconnection or branch mismatch in KDS view.
- **Safe Resolution**:
  - Select the correct branch in the KDS filter dropdown.
  - Refresh the page to re-establish the real-time channel.
- **Escalation**: Escalate if order does not appear even after a hard refresh (indicates order was not committed to DB).

---

## 4. Issue: "Thermal Printer Not Printing Receipts or KOT"
- **Symptoms**: POS checkout succeeds, but no printout is generated.
- **First Checks**:
  1. Verify the printer power, paper roll, and USB/Ethernet connection.
  2. Confirm browser print dialog permissions are enabled.
  3. Check Printer Settings in DineFlow (`/settings/printer`) for correct paper width (80mm vs 58mm).
- **Likely Cause**: Hardware out of paper, network IP change of the printer, or browser pop-up blocker.
- **Safe Resolution**:
  - Click "Reprint Receipt" on the POS completed order modal or Bills view.
  - Re-check ESC/POS network IP address in printer configuration.
- **Escalation**: Escalate if ESC/POS payload generation produces formatting corruption.

---

## 5. Issue: "Daily Closing Cash Variance Mismatch"
- **Symptoms**: Manager reports physical cash drawer does not match expected cash total.
- **First Checks**:
  1. Compare the detailed payments list in Daily Closing (`/administration/daily-closing`).
  2. Check for payments marked as `CASH` that were actually paid via `UPI` or `CARD`.
  3. Review refunds and voided bills for the shift.
- **Likely Cause**: Cashier mistyped tender method during payment entry.
- **Safe Resolution**:
  - Manager enters the true physical cash count; DineFlow records the exact variance in the audit record without altering historical transactions.
- **Escalation**: Escalate if cash totals differ from individual order line items.
