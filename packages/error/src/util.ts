/**
 * The normalizers: every failure a client meets — an error response or a
 * thrown transport exception — folds into the hierarchy through these.
 */

import { STATUS_ERRORS } from "./constant";
import { AbortError, HttpError, NetworkError, ServerError } from "./error";
import type { HttpErrorClass } from "./types";

/**
 * Resolves the error class for a status: a specific class when one is mapped,
 * {@link ServerError} for any 5xx, {@link HttpError} otherwise.
 */
export const errorClassFor = (status: number): HttpErrorClass =>
  STATUS_ERRORS[status] ?? (status >= 500 ? ServerError : HttpError);

interface ErrorBodyShape {
  code?: unknown;
  message?: unknown;
}

/** Builds the status-appropriate error from a non-2xx response and its parsed body. */
export const errorFromResponse = (
  method: string,
  path: string,
  response: Response,
  body: unknown,
): HttpError => {
  const shape: ErrorBodyShape =
    typeof body === "object" && body !== null ? (body as ErrorBodyShape) : {};
  const code =
    typeof shape.code === "string" ? shape.code : `HTTP_${response.status}`;
  const message =
    typeof shape.message === "string" && shape.message.length > 0
      ? shape.message
      : response.statusText || `Request failed with status ${response.status}`;
  const ErrorClass = errorClassFor(response.status);
  return new ErrorClass({
    status: response.status,
    code,
    message,
    body,
    method,
    path,
  });
};

/** Builds a transport error from a thrown fetch (rejection or abort). */
export const errorFromException = (
  method: string,
  path: string,
  cause: unknown,
): NetworkError | AbortError => {
  const aborted = cause instanceof Error && cause.name === "AbortError";
  const init = {
    message: cause instanceof Error ? cause.message : "Network request failed",
    method,
    path,
    cause,
  };
  return aborted ? new AbortError(init) : new NetworkError(init);
};
