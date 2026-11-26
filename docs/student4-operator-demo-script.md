# Student 4 Week 6 operator demo script

Target duration: 3–5 minutes. Use a local test database with non-production
accounts and sample records. Do not use real beneficiary or supplier data.

1. Introduce NIB-Connect's simulated operations and security control layer.
2. Sign in as a provisioned NIB system operator and open
   `/operator/dashboard`.
3. Show operator metrics and explain that dashboard/escrow views are
   read-only.
4. Open `/operator/suppliers`, verify a pending sample supplier, and show its
   audit record.
5. Sign out and show that a beneficiary can see active products from verified
   suppliers only.
6. Return as operator and show voucher/order monitoring, including the
   confirmed overdue-voucher expiry action.
7. Open `/operator/audit-logs` and filter the supplier verification action.
8. Open `/operator/security-events` and explain the event filters and
   sensitive-metadata redaction.
9. Open `/operator/notifications` and show alert ownership, unread count, and
   mark-as-read behavior.
10. Explain server-side RBAC, session expiry, and security-event IP handling.

Do not demonstrate OTP lockout, beneficiary-only delivery confirmation, or
replay prevention until Student 3's implementation is integrated and those
controls have been tested. Likewise, do not claim reconciliation is complete
without its API/contract. Capture screenshots and record a demo only after the
integrated branch is stable.
