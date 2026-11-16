# Scheduled Functions

| Cron | Function | Purpose |
|------|----------|---------|
| `0 8 * * *` | `scanStockAlerts` | Low cement / blocks / aggregates |
| `0 18 * * 6` | `generateWeeklyReport` | Saturday evening weekly snapshot + email/push |
| `*/15 * * * *` | `pushFallback` | Critical alerts unopened → email (SMS optional) |
| `0 9 * * *` | `supplyDueReminders` | Supplier payment due / BR pending N days |

Push destination: Appwrite Messaging topic `owner-alerts` (FCM for Android PWA).
