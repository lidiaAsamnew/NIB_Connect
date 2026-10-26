# NIB-Connect QA Strategy

## Purpose

The QA strategy defines how NIB-Connect will be tested to identify defects, verify expected behavior, and maintain system quality throughout development.

## Testing Approach

### 1. Manual Testing

Manual testing will be used to verify important user workflows and identify usability or functional problems.

Examples include:

- Registration and login
- Role-based access
- Voucher workflows
- Product and order workflows
- Delivery OTP verification
- Escrow and clearing workflows
- Compliance reporting

### 2. Postman API Testing

Postman will be used to test backend APIs.

API testing will verify:

- HTTP status codes
- Response structure
- Required fields
- Validation behavior
- Authentication
- Authorization
- Error handling
- Important business rules

The Postman collection will be updated as new endpoints become available.

### 3. Automated API Testing

Automated tests will be added for important backend functionality as the team modules become available.

Priority areas include:

- Authentication
- Role-based access control
- Voucher lifecycle
- Order state transitions
- OTP verification
- Escrow transactions
- Compliance reporting

### 4. Frontend Testing

Frontend testing may be used to verify important user interface workflows, forms, navigation, API integration, and error states.

## Regression Testing

After major changes or integration work, previously tested functionality should be checked again to make sure new changes have not introduced regressions.

The regression checklist should include:

- Authentication
- Role permissions
- Voucher and order workflows
- Supplier workflows
- Delivery handshake
- Escrow clearing
- Compliance reporting
- API health/version
- Frontend API connectivity

## Defect Severity

| Severity | Description |
|---|---|
| Critical | System down, financial data corruption, or authentication/security bypass |
| High | Major feature broken or incorrect settlement/voucher status |
| Medium | Minor feature problem, validation issue, or confusing UI behavior |
| Low | Cosmetic issue, typo, or minor alignment problem |

## Defect Reporting

Defects should be recorded in:

```text
docs/defect-log.md
```

Each defect should include:

- ID
- Date Reported
- Module
- Severity
- Description
- Expected
- Actual
- Status
- Reported By

## QA Evidence

Testing evidence should be collected throughout development.

Examples include:

- Postman test results
- Automated test results
- Screenshots
- API responses
- Defect records
- Regression test results

## Release Readiness

Before release, the team should verify:

- Required features are integrated
- Critical and high-severity defects are resolved
- Authentication and authorization work correctly
- API tests pass
- Compliance endpoints remain read-only
- Environment variables and secrets are secure
- Health and version endpoints work
- Frontend and backend communicate correctly
- Deployment configuration has been reviewed


