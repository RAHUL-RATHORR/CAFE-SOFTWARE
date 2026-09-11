# PERFORMANCE CHECKLIST

Mark each item as `[x] PASS`, `[ ] FAIL`, or `[ ] NEEDS REVIEW` based on actual testing. Do NOT mark PASS without verifying in the environment.

## Database & APIs
- `[ ]` **Database Queries**: Frequently accessed queries (e.g., Orders, Items) use appropriate MongoDB indexes.
- `[ ]` **N+1 Queries**: Mongoose `populate()` is used efficiently without causing cascading query waterfalls.
- `[ ]` **API Response Time**: Critical APIs (Login, POS Checkout, Dashboard load) respond quickly (ideally <300ms).

## Dashboard & Reports
- `[ ]` **Analytics**: Sales and inventory analytics are calculated server-side using MongoDB Aggregation, not in the browser.
- `[ ]` **Reports**: Heavy date-range reports load reliably without timing out or crashing Vercel functions.
- `[ ]` **Large Exports**: CSV/Excel/PDF exports handle thousands of records safely.

## Frontend & Memory
- `[ ]` **Frontend Load**: Initial Next.js bundle sizes are reasonable. Unused large dependencies are avoided.
- `[ ]` **Memory**: Navigating between POS, KDS, and Dashboard repeatedly does not cause memory leaks or UI freezes.
- `[ ]` **Mobile Performance**: The QR ordering interface remains highly responsive on standard mobile devices.

## Real-Time & WebSockets
- `[ ]` **KDS Real-Time**: WebSocket connections correctly broadcast updates without extreme duplicate events.
- `[ ]` **WebSocket Reconnects**: Dropped network connections attempt to gracefully reconnect.
- `[ ]` **Polling**: Components do not leak excessive `setInterval` polling when backgrounded.
