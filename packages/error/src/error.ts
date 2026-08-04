/**
 * The error hierarchy every openforge client throws. Two families under one
 * root: {@link HttpError} for responses the server actually sent (with the
 * status-specific subclasses a consumer branches on via `instanceof`), and
 * {@link TransportError} for requests that never completed. `code` and `body`
 * still carry the API's own error vocabulary for finer-grained handling.
 */

import type { ForgeErrorInit, HttpErrorInit } from "./types";

/** Root of the hierarchy: everything an openforge client throws extends this. */
export class ForgeError extends Error {
  readonly method: string;
  readonly path: string;

  constructor(init: ForgeErrorInit) {
    super(
      init.message,
      init.cause !== undefined ? { cause: init.cause } : undefined,
    );
    this.name = "ForgeError";
    this.method = init.method;
    this.path = init.path;
  }
}

/** A response the server sent with a non-2xx status. */
export class HttpError extends ForgeError {
  readonly status: number;
  readonly code: string;
  readonly body: unknown;

  constructor(init: HttpErrorInit) {
    super(init);
    this.name = "HttpError";
    this.status = init.status;
    this.code = init.code;
    this.body = init.body;
  }
}

/** 400 — the request was malformed. */
export class BadRequestError extends HttpError {
  constructor(init: HttpErrorInit) {
    super(init);
    this.name = "BadRequestError";
  }
}

/** 401 — the request lacked valid credentials. */
export class UnauthorizedError extends HttpError {
  constructor(init: HttpErrorInit) {
    super(init);
    this.name = "UnauthorizedError";
  }
}

/** 403 — the credentials were valid but insufficient. */
export class ForbiddenError extends HttpError {
  constructor(init: HttpErrorInit) {
    super(init);
    this.name = "ForbiddenError";
  }
}

/** 404 — the resource does not exist. */
export class NotFoundError extends HttpError {
  constructor(init: HttpErrorInit) {
    super(init);
    this.name = "NotFoundError";
  }
}

/** 409 — the request conflicts with the resource's current state. */
export class ConflictError extends HttpError {
  constructor(init: HttpErrorInit) {
    super(init);
    this.name = "ConflictError";
  }
}

/** 422 — the request was well-formed but semantically invalid. */
export class UnprocessableError extends HttpError {
  constructor(init: HttpErrorInit) {
    super(init);
    this.name = "UnprocessableError";
  }
}

/** 429 — the caller is being rate limited. */
export class RateLimitError extends HttpError {
  constructor(init: HttpErrorInit) {
    super(init);
    this.name = "RateLimitError";
  }
}

/** 5xx — the server failed; `status` distinguishes 500/502/503/504. */
export class ServerError extends HttpError {
  constructor(init: HttpErrorInit) {
    super(init);
    this.name = "ServerError";
  }
}

/** A request that never completed — no response, so no status. */
export class TransportError extends ForgeError {
  constructor(init: ForgeErrorInit) {
    super(init);
    this.name = "TransportError";
  }
}

/** The fetch itself failed (DNS, connection reset, offline). */
export class NetworkError extends TransportError {
  constructor(init: ForgeErrorInit) {
    super(init);
    this.name = "NetworkError";
  }
}

/** The caller cancelled the request via its abort signal. */
export class AbortError extends TransportError {
  constructor(init: ForgeErrorInit) {
    super(init);
    this.name = "AbortError";
  }
}

/** The call was refused by an open circuit breaker — no request was attempted. */
export class CircuitOpenError extends TransportError {
  constructor(init: ForgeErrorInit) {
    super(init);
    this.name = "CircuitOpenError";
  }
}

/** The call exceeded a configured time budget. */
export class TimeoutError extends TransportError {
  constructor(init: ForgeErrorInit) {
    super(init);
    this.name = "TimeoutError";
  }
}
