/**
 * @openapi-press/error — the granular, HTTP-aware error system shared by every
 * openapi-press layer.
 *
 * One hierarchy under {@link PressError}: `HttpError` subclasses for the
 * responses a server sent (branch with `instanceof NotFoundError` instead of
 * `status === 404`), `TransportError` subclasses for requests that never
 * completed. The normalizers fold raw responses and thrown exceptions into it.
 */

export * from "./constant";
export * from "./error";
export * from "./types";
export * from "./util";
