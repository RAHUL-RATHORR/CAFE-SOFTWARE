# DineFlow Production Architecture

## Overview

The DineFlow SaaS architecture is designed to support a multi-tenant environment, offering high isolation, scaling, and fault tolerance across its subsystems.

```text
User / Customer / Restaurant Staff
        │
    HTTPS (TLS)
        │
     CDN / WAF (Cloudflare/AWS)
        │
    Next.js (App Router)  <──────> [ WebSocket Server (wss://) ]
        │                                      │
    API (Route Handlers)                       │
        │                                      │
  Authentication & RBAC (NextAuth v5)          │
        │                                      │
  Rate Limiter & CORS Middleware               │
        │                                      │
   Business Services (Tenant Isolated)         │
    - Order Service                            │
    - Billing Service                          │
    - Inventory Service                        │
    - Reporting Service                        │
        │                                      │
  Database Connection Pool (maxPoolSize=50)    │
        │                                      │
  MongoDB Atlas (Production Cluster) <─────────┘
```

## Sub-System Trace Maps

### 1. Public Customer QR Ordering

```text
Customer scans QR Code
       ↓
HTTPS Request `app.dineflow.com/order/<tableToken>`
       ↓
Rate Limiter (`middleware.ts`) checks `/order` path limit
       ↓
Table details retrieved securely (No internal ObjectId exposed)
       ↓
Order submitted
       ↓
KDS / Printer notified via WebSocket / Webhooks
```

### 2. POS Billing

```text
Staff creates Bill on POS
       ↓
HTTPS Request `/api/pos/checkout`
       ↓
Session Token Validation (Checks Tenant/Branch Ownership)
       ↓
Billing Service computes Tax, Discounts
       ↓
Payment Processor (Razorpay Integration / Cash)
       ↓
Invoice Created
       ↓
Thermal Printer payload triggered
```
