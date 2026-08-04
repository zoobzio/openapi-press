/**
 * The statuses that map to a specific error class. Everything else resolves
 * through {@link errorClassFor}'s range rules.
 */

import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  UnprocessableError,
} from "./error";
import type { HttpErrorClass } from "./types";

export const STATUS_ERRORS: Readonly<Record<number, HttpErrorClass>> = {
  400: BadRequestError,
  401: UnauthorizedError,
  403: ForbiddenError,
  404: NotFoundError,
  409: ConflictError,
  422: UnprocessableError,
  429: RateLimitError,
};
