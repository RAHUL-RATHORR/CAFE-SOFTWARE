# DineFlow Production Checklist

### Infrastructure
- [ ] Production database created
- [ ] Database user created
- [ ] Network access configured
- [ ] Production environment variables configured
- [ ] Frontend deployed
- [ ] Backend deployed
- [ ] Domain connected
- [ ] HTTPS active

### Security
- [ ] Secure cookies (`COOKIE_SECURE=true`)
- [ ] CORS restricted via `CORS_ORIGINS`
- [ ] Secrets not exposed in `.env.example`
- [ ] Rate limiting enabled
- [ ] Security headers enabled
- [ ] Tenant isolation tested (no cross-restaurant leaks)
- [ ] Admin routes protected

### Application
- [ ] Login works
- [ ] Restaurant onboarding works
- [ ] QR ordering works
- [ ] KDS works
- [ ] POS works
- [ ] Billing works
- [ ] Inventory works
- [ ] Notifications work
- [ ] Reports work
- [ ] Backup works

### Production specific
- [ ] Health check works (`/api/health`, `/api/health/db`)
- [ ] Structured JSON Logs work
- [ ] Error handling safely scrubs MongoDB URIs/StackTrace
- [ ] WebSocket securely proxies through wss://
- [ ] QR URLs securely point to `APP_URL`
- [ ] No `localhost` URLs in production environment variables
- [ ] Build succeeds (`npm run build`)
