# Student 4 individual contribution statement

I am Loza Yonas, responsible for NIB operations and the platform security
foundation. This Week 6 branch is based on my Week 5 branch and adds
independent security hardening, role-based test evidence, deployment notes,
audit/security-event documentation, and an operator demo script.

Week 6 work on this branch:

- Added source-IP capture for authentication, login, rate-limit, and
  authorization security events, with proxy trust limited to configured
  `TRUSTED_PROXY_CIDRS`.
- Added `SECURITY_EVENT_CREATED` audit entries and aligned new login-failure
  audit actions with `USER_LOGIN_FAILED`.
- Added frontend handling for expired and deactivated sessions.
- Expanded automated RBAC/security tests and documented their results.
- Added the Week 6 RBAC matrix, security test report, final README module
  section, and operator demo script.

Still requiring team integration or shared environment access: delivery OTP
throttling/lockout/replay controls, reconciliation, supplier product/order
APIs, full EU reporting, live deployment checks, final screenshots, and a
recorded demo. These are not claimed as completed by this contribution.
