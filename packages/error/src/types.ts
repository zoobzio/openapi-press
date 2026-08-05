/**
 * The init shapes the error classes are constructed from, and the constructor
 * contract the status map is keyed on.
 */

import type { HttpError } from "./error";

/** Fields carried by every {@link PressError}. */
export interface PressErrorInit {
  /** Human-readable message. */
  message: string;
  /** HTTP method of the originating request. */
  method: string;
  /** OpenAPI schema path (with `{param}` placeholders) of the request. */
  path: string;
  /** Underlying cause (e.g. the thrown network error). */
  cause?: unknown;
}

/** Fields carried by every {@link HttpError}. */
export interface HttpErrorInit extends PressErrorInit {
  /** HTTP status code of the response. */
  status: number;
  /** Machine-readable code: the API's error code, or a synthetic fallback. */
  code: string;
  /** Parsed error response body, when the failure carried one. */
  body?: unknown;
}

/** An HttpError subclass constructor, as held in the status map. */
export type HttpErrorClass = new (init: HttpErrorInit) => HttpError;
