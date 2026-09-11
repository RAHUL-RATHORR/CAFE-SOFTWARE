# Changelog

All notable changes to the **DineFlow** restaurant management SaaS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-09-10

### Added
- **Multi-Tenant Foundation**: Complete tenant isolation, custom branding, currency support, and branch scoping.
- **Authentication & RBAC**: NextAuth.js v5 integration with Bcrypt password security, session timeout, role capabilities, and forced first-login password reset.
- **Restaurant Onboarding**: Multi-step initialization wizard for profile, tax information, and branch establishment.
- **Table QR Ordering**: Dynamic branded table QR code generation and mobile-optimized customer self-ordering catalog.
- **Kitchen Display System (KDS)**: Real-time ticket lifecycle management (`Received`, `Preparing`, `Ready`, `Served`) with station filters and elapsed time alerts.
- **Point of Sale (POS)**: Fast checkout terminal supporting Dine-in, Takeaway, modifier customization, discounts, and split payments.
- **GST Invoicing & Billing**: Indian GST compliance (CGST, SGST, IGST) with sequential invoice numbering and itemized tax breakdowns.
- **ESC/POS Printing**: Hardware printer abstraction generating thermal command streams for receipts and Kitchen Order Tickets (KOT).
- **Inventory & Recipe Management**: Raw ingredient tracking, metric unit conversion, Bill of Materials (BOM) linking, and automatic stock deduction.
- **Daily Closing**: End-of-shift reconciliation workflow calculating physical cash variance and locking the business day.
- **Analytics Dashboard**: Server-side MongoDB aggregations for GMV, AOV, top-selling items, and sales trends.
- **Notification Engine**: Centralized multi-channel dispatch architecture supporting WhatsApp, Email, and SMS with template management.
- **Reports & Data Export**: Multi-format reporting engine supporting PDF, Excel (.xlsx), and CSV exports.
- **Backup System**: Password-sanitized tenant database backup engine creating encrypted ZIP archives.
- **Public Endpoints**: `/api/health` and `/version` endpoints providing uptime and release metadata.
