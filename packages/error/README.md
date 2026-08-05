# @openapi-press/error

The granular, HTTP-aware error system shared by every openapi-press layer.

## The error model

Everything an openapi-press client throws extends `PressError`, which splits into
two families. `HttpError` covers responses the server actually sent: each
common status gets its own class, so consumers branch with
`instanceof NotFoundError` rather than `status === 404`, while `code` and
`body` still carry the API's own error vocabulary. `TransportError` covers
requests that never completed — no response, so no status.

```
PressError
├── HttpError                 status · code · body
│   ├── BadRequestError       400
│   ├── UnauthorizedError     401
│   ├── ForbiddenError        403
│   ├── NotFoundError         404
│   ├── ConflictError         409
│   ├── UnprocessableError    422
│   ├── RateLimitError        429
│   └── ServerError           5xx
└── TransportError
    ├── NetworkError          fetch failed
    ├── AbortError            caller cancelled
    ├── TimeoutError          time budget exceeded
    └── CircuitOpenError      refused by an open circuit breaker
```

Unmapped 4xx statuses resolve to plain `HttpError`; every 5xx resolves to
`ServerError` with `status` preserved.

## Usage

```ts
import {
  NotFoundError,
  RateLimitError,
  TransportError,
} from "@openapi-press/error";

try {
  const user = await client.users.get("user-123");
} catch (error) {
  if (error instanceof NotFoundError) return null;
  if (error instanceof RateLimitError) return backoff();
  if (error instanceof TransportError) return offline();
  throw error;
}
```

## API

- `PressError` — the hierarchy root: `message` · `method` · `path` · `cause`.
- `HttpError` and its status subclasses — add `status` · `code` · `body`.
- `TransportError` / `NetworkError` / `AbortError` / `TimeoutError` /
  `CircuitOpenError` — failures without a response.
- `errorFromResponse(method, path, response, body)` — builds the
  status-appropriate error from a non-2xx response.
- `errorFromException(method, path, cause)` — folds a thrown fetch into
  `AbortError` or `NetworkError`.
- `errorClassFor(status)` — the class a status resolves to.
- `STATUS_ERRORS` — the status → class map.
