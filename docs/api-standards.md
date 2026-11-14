# NIB-Connect API Standards

## Purpose

This document defines the standard format for NIB-Connect API responses, HTTP status codes, and common API behavior.

All backend modules should follow these standards so that the frontend, Postman tests, and compliance reporting layer can work consistently.

## Success Response

Successful API responses should use the following structure:

```json
{
  "success": true,
  "message": "Optional message",
  "data": {},
  "meta": {}
}
```

### Fields

- `success` — Indicates whether the request was successful.
- `message` — Optional message describing the result.
- `data` — Response data.
- `meta` — Optional metadata such as pagination or record counts.

## Error Response

Errors should use the following structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```

### Fields

- `success` — Always `false` for an error.
- `message` — Human-readable description of the error.
- `errors` — Optional detailed validation or error information.

## HTTP Status Codes

| Status | Meaning | Typical Use |
|---|---|---|
| `200` | OK | Successful request |
| `201` | Created | Resource successfully created |
| `400` | Bad Request | Validation error |
| `401` | Unauthorized | Authentication required or invalid |
| `403` | Forbidden | User does not have permission |
| `404` | Not Found | Resource does not exist |
| `409` | Conflict | Duplicate or conflicting resource |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server error |

## API Guidelines

- Use appropriate HTTP methods and status codes.
- Return consistent JSON response structures.
- Validate incoming request data.
- Do not expose passwords, secrets, or sensitive authentication data.
- Protected endpoints must require appropriate authentication and authorization.
- API changes should be documented and reflected in the Postman collection.
- Read-only compliance endpoints must not provide mutation operations.


