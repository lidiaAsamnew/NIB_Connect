# NIB-Connect Data Dictionary

## Purpose

This document describes the main database entities and important fields used by the NIB-Connect Mini project.

## User

| Field | Type | Description |
|---|---|---|
| `id` | varchar | Unique identifier for the user. |
| `email` | varchar | User's unique login email address. |
| `passwordHash` | varchar | Securely stored password hash. |
| `role` | varchar | Defines the user's system role and access level. |
| `isActive` | boolean | Indicates whether the user account is active. |
| `createdAt` | datetime | Date and time the user was created. |
| `updatedAt` | datetime | Date and time the user was last updated. |

### User Roles

The main project roles are:

- `EU_COMPLIANCE_OFFICER`
- `NIB_SYSTEM_OPERATOR`
- `TIER1_SUPPLIER`
- `WOMEN_STARTUP_OWNER`

## StartupProfile

| Field | Type | Description |
|---|---|---|
| `id` | varchar | Unique startup profile identifier. |
| `userId` | varchar | Links the startup profile to its user account. |
| `businessName` | varchar | Name of the startup/business. |
| `sector` | varchar | Business or market sector. |
| `region` | varchar | Startup's region. |
| `createdAt` | datetime | Date and time the profile was created. |
| `updatedAt` | datetime | Date and time the profile was last updated. |

## SupplierProfile

| Field | Type | Description |
|---|---|---|
| `id` | varchar | Unique supplier profile identifier. |
| `userId` | varchar | Links the supplier profile to its user account. |
| `businessName` | varchar | Name of the supplier business. |
| `verificationStatus` | varchar | Current supplier verification status. |
| `createdAt` | datetime | Date and time the profile was created. |
| `updatedAt` | datetime | Date and time the profile was last updated. |

## Product

| Field | Type | Description |
|---|---|---|
| `id` | varchar | Unique product identifier. |
| `supplierId` | varchar | Links the product to its supplier. |
| `name` | varchar | Product name. |
| `description` | text | Description of the product. |
| `price` | decimal | Product unit price. |
| `stockQuantity` | int | Available product quantity. |
| `createdAt` | datetime | Date and time the product was created. |
| `updatedAt` | datetime | Date and time the product was last updated. |

## Voucher

| Field | Type | Description |
|---|---|---|
| `id` | varchar | Unique voucher identifier. |
| `startupId` | varchar | Startup that owns the voucher. |
| `amount` | decimal | Monetary value of the voucher. |
| `status` | varchar | Current voucher lifecycle status. |
| `allocatedById` | varchar | User who allocated the voucher. |
| `expiresAt` | datetime | Optional voucher expiration date and time. |
| `createdAt` | datetime | Date and time the voucher was created. |
| `updatedAt` | datetime | Date and time the voucher was last updated. |

### Voucher Status

- `ALLOCATED`
- `COMMITTED_TO_ORDER`
- `REDEEMED_AND_SETTLED`

## Order

| Field | Type | Description |
|---|---|---|
| `id` | varchar | Unique order identifier. |
| `startupId` | varchar | Startup that created the order. |
| `supplierId` | varchar | Supplier responsible for the order. |
| `voucherId` | varchar | Voucher associated with the order. |
| `grossAmount` | decimal | Total order value before discount. |
| `discountApplied` | decimal | Discount applied to the order. |
| `netAmountToPay` | decimal | Final amount to be paid after discount. |
| `status` | varchar | Current order lifecycle status. |
| `waybillCode` | varchar | Unique waybill/shipment code. |
| `otpSecureHash` | varchar | Secure hash of the delivery OTP. |
| `otpExpiresAt` | datetime | Expiration time of the delivery OTP. |
| `dispatchedAt` | datetime | Time the order was dispatched. |
| `arrivedAt` | datetime | Time the order arrived. |
| `clearedAt` | datetime | Time the order was verified and cleared. |
| `cancelReason` | text | Reason for cancellation, when applicable. |
| `createdAt` | datetime | Date and time the order was created. |
| `updatedAt` | datetime | Date and time the order was last updated. |

### Order Status

The order lifecycle is:

`PLACED → DISPATCHED_IN_TRANSIT → DELIVERED_PENDING_HANDSHAKE → VERIFIED_AND_CLEARED`

## OrderItem

| Field | Type | Description |
|---|---|---|
| `id` | varchar | Unique order-item identifier. |
| `orderId` | varchar | Links the item to an order. |
| `productId` | varchar | Product included in the order. |
| `quantity` | int | Number of units ordered. |
| `unitPrice` | decimal | Price of one unit at the time of ordering. |
| `lineTotal` | decimal | Total value for this item line. |
| `createdAt` | datetime | Date and time the item was created. |

## DeliveryHandshake

| Field | Type | Description |
|---|---|---|
| `id` | varchar | Unique delivery-handshake identifier. |
| `orderId` | varchar | Order being verified. |
| `submittedByUserId` | varchar | User who submitted the OTP verification attempt. |
| `phoneNumber` | varchar | Phone number associated with the verification attempt. |
| `otpHash` | varchar | Secure hash of the submitted OTP. |
| `ipAddress` | varchar | IP address associated with the attempt. |
| `success` | boolean | Indicates whether the verification succeeded. |
| `message` | text | Result or additional information about the attempt. |
| `attemptedAt` | datetime | Date and time of the verification attempt. |

## EscrowTransaction

| Field | Type | Description |
|---|---|---|
| `id` | varchar | Unique escrow transaction identifier. |
| `orderId` | varchar | Order associated with the transaction. |
| `voucherId` | varchar | Voucher associated with the transaction. |
| `direction` | varchar | Transaction direction: `DEBIT` or `CREDIT`. |
| `amount` | decimal | Monetary value of the transaction. |
| `reference` | varchar | Unique mock-ledger transaction reference. |
| `description` | text | Description of the transaction. |
| `status` | varchar | Current transaction status. |
| `createdAt` | datetime | Date and time the transaction was created. |

## AuditLog

| Field | Type | Description |
|---|---|---|
| `id` | varchar | Unique audit-log identifier. |
| `userId` | varchar | User associated with the recorded action. |
| `action` | varchar | Action performed. |
| `entityType` | varchar | Type of entity affected by the action. |
| `entityId` | varchar | Identifier of the affected entity. |
| `details` | text | Additional information about the action. |
| `ipAddress` | varchar | IP address associated with the action. |
| `createdAt` | datetime | Date and time the action was recorded. |

## Notification

| Field | Type | Description |
|---|---|---|
| `id` | varchar | Unique notification identifier. |
| `userId` | varchar | User receiving the notification. |
| `type` | varchar | Type of notification. |
| `title` | varchar | Notification title. |
| `message` | text | Notification content. |
| `isRead` | boolean | Indicates whether the notification has been read. |
| `createdAt` | datetime | Date and time the notification was created. |


