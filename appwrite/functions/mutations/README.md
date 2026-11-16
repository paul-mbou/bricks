# Bricks Appwrite Functions — mutations

Deploy as Appwrite Cloud Functions using `node-appwrite`.

## Required functions

| Name | Trigger | Role check | Effect |
|------|---------|------------|--------|
| `receiveSupply` | HTTP | storekeeper+ | BR qty → StockMovement + variance Alert |
| `approveSupply` | HTTP | owner | status APPROVED + AuditLog |
| `paySupplier` | HTTP | owner (+ secretary exec after approve) | partial/full payment |
| `validateProduction` | HTTP | production+ | cement/aggregate out + blocks in (idempotent `clientOpId`) |
| `createSale` | HTTP | manager+ | block out + optional delivery loss |
| `approvePayroll` | HTTP | owner | period approved |
| `markPayrollPaid` | HTTP | secretary after approve | status paid |
| `closeWeeklyReport` | HTTP | owner | freeze snapshot |
| `inventoryAdjust` | HTTP | storekeeper+ | ADJUSTMENT movement with note |

## Contract

1. Validate body with Zod.
2. Re-read caller labels via Users API.
3. Apply domain rules from `packages/domain`.
4. Write AuditLog.
5. Create Alert (dedupeKey) then Messaging push for owner — never from client.

SDK versions: see root README.
