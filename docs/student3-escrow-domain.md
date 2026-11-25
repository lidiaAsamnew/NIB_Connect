# Student 3: Escrow Domain Model

**Author:** Metaniya Shiferaw, Escrow and Clearing Gateway Developer

## Purpose
This module is the financial engine of NIB-Connect. It controls vouchers, orders,
the delivery OTP handshake, and escrow clearing, so that a supplier is paid only
after the beneficiary confirms delivery.

## Voucher lifecycle
`ALLOCATED` -> `COMMITTED_TO_ORDER` -> `REDEEMED_AND_SETTLED`

| Status | Meaning |
|---|---|
| ALLOCATED | Operator gave the startup a spending allowance. Not yet used. |
| COMMITTED_TO_ORDER | The voucher is locked for one specific order. |
| REDEEMED_AND_SETTLED | The beneficiary confirmed delivery and the supplier was paid. |

A cancelled order returns its voucher to ALLOCATED (Week 5).

## Order lifecycle
`PLACED` -> `DISPATCHED_IN_TRANSIT` -> `DELIVERED_PENDING_HANDSHAKE` -> `VERIFIED_AND_CLEARED`

| Status | Meaning |
|---|---|
| PLACED | Startup created the order; voucher committed; stock reduced. |
| DISPATCHED_IN_TRANSIT | Supplier shipped; waybill code issued. |
| DELIVERED_PENDING_HANDSHAKE | Goods arrived; OTP generated and waiting for the beneficiary. |
| VERIFIED_AND_CLEARED | Correct OTP entered; supplier settled. |

## Relationship between Order, Voucher, and EscrowTransaction
- One Voucher funds at most one Order (`Order.voucherId` is unique).
- One Order has many OrderItems (one per product line).
- One Order has many EscrowTransactions: a DEBIT (funds leaving the voucher
  commitment) and a CREDIT (supplier settlement).
- One Order has many DeliveryHandshake rows: a log of every OTP attempt,
  successful or not.

## Why Prisma transactions are required
Settlement changes several records at once: the order status, the voucher status,
the escrow records, and the ledger call. A Prisma transaction makes these succeed
or fail together. Without it, a crash could mark a voucher as spent without paying
the supplier, or pay the supplier twice.

## How the OTP is stored securely
The OTP is a random 6-digit code. Only its SHA-256 hash is saved in
`Order.otpSecureHash`, together with an expiry time (`otpExpiresAt`). The plain OTP
is never stored. When the beneficiary submits an OTP, the system hashes it and
compares the two hashes. SHA-256 is one-way, so a leaked database does not reveal
any OTP.

## How mock ledger clearing works
There is no real bank integration. A service (`nibLedgerService.js`, built in
Week 4) simulates NIB Bank: it receives the destination account and amount and
returns a success response with a reference ID. This lets us test the whole
settlement flow. A configurable failure rate (`MOCK_LEDGER_FAIL_RATE`) lets us
test rollback behavior.

## Week 1 deliverables
- Prisma schema: Voucher, Order, OrderItem, DeliveryHandshake, EscrowTransaction,
  plus supporting Product and enums
- MySQL migration `add_escrow_domain_models`
- Seed data covering all voucher and order states
- Utilities: `otp.js`, `money.js`, `reference.js`
- Skeleton: `clearingGateway.js`
- API: `GET /api/escrow/monitor-summary`