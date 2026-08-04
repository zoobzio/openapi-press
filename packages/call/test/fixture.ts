/**
 * Doubles for exercising calls and wrappers: a standard meta, a handler that
 * fails a set number of times before succeeding, and a tracing wrapper that
 * logs entry/exit so composition order is observable.
 */

import { ServerError } from "@openforge/error";

import type { CallMeta, Handler, Wrapper } from "../src/types";

export const META: CallMeta = { method: "get", path: "/users/{user_id}" };

/** A handler that throws `failures` ServerErrors before resolving `value`. */
export const flaky = <R>(
  failures: number,
  value: R,
): { handler: Handler<[], R>; calls: () => number } => {
  let count = 0;
  const handler = async (): Promise<R> => {
    count++;
    if (count <= failures) {
      throw new ServerError({
        status: 503,
        code: "HTTP_503",
        message: "unavailable",
        method: META.method,
        path: META.path,
      });
    }
    return value;
  };
  return { handler, calls: () => count };
};

/** A wrapper that logs entry and exit under `name`, for order assertions. */
export const trace =
  (name: string, log: string[]): Wrapper =>
  (next) =>
  async (...args) => {
    log.push(`>${name}`);
    const result = await next(...args);
    log.push(`<${name}`);
    return result;
  };
