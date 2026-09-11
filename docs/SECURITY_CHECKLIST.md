# SECURITY CHECKLIST

Mark each item as `[x] PASS`, `[ ] FAIL`, or `[ ] NEEDS REVIEW` based on actual testing. Do NOT mark PASS without verifying in the environment.

## Authentication & Authorization
- `[ ]` **Authentication**: Valid login creates a secure, HTTP-only session.
- `[ ]` **Authorization**: Protected routes require valid roles and reject unauthorized requests (401/403).
- `[ ]` **Session Security**: Logout immediately invalidates the session server-side.

## Multi-Tenant Security
- `[ ]` **Tenant Isolation**: Tenant A cannot read, edit, or delete Tenant B's data (orders, inventory, staff).
- `[ ]` **Branch Isolation**: Branch A staff cannot view or interact with Branch B's POS or KDS.
- `[ ]` **IDOR**: Direct API access via guessing Object IDs (e.g., `/api/orders/:id`) correctly rejects unauthorized users.

## Data & Input Safety
- `[ ]` **Input Validation**: Critical fields (prices, quantities, discounts) are strictly validated backend-side using Zod.
- `[ ]` **XSS**: User-supplied input (e.g., table names, item descriptions) is properly sanitized/escaped in the frontend.
- `[ ]` **NoSQL Injection**: Database queries never pass untrusted objects directly to MongoDB operators.
- `[ ]` **Mass Assignment**: The backend explicitly picks allowed fields for updates, ignoring injected payload properties.

## Transport & Architecture
- `[ ]` **CSRF**: State-changing requests are protected via SameSite cookies or explicit headers.
- `[ ]` **CORS**: APIs reject cross-origin requests from unauthorized external domains.
- `[ ]` **Rate Limiting**: Public endpoints (QR ordering, login) have strict rate limiting to prevent abuse.
- `[ ]` **Webhooks**: Third-party callbacks (e.g., Payments) verify cryptographic signatures before acting.

## Infrastructure
- `[ ]` **Secrets**: Passwords, JWT secrets, and DB URIs are never hardcoded or exposed in error messages/logs.
- `[ ]` **File Upload Security**: (If applicable) Uploads enforce strict MIME type and size limits.
- `[ ]` **Security Headers**: HSTS, CSP, X-Frame-Options, and other critical headers are present in the responses.
- `[ ]` **Backups**: Zip exports strip all sensitive credentials and hashes before download.
