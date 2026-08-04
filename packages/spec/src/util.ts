/**
 * The runtime companions to the type plane: descriptor construction and
 * guarding, and the `{param}` template parser mirroring
 * {@link PathParamNames}. The parser and the type must agree on what a
 * template means; they are tested against each other.
 */

import type { HttpMethod } from "openapi-typescript-helpers";

import { OP_BRAND } from "./constant";
import type { OpDescriptor } from "./types";

/** Creates a branded descriptor. {@link defineSpec} wraps this with path checking. */
export const makeOp = <M extends HttpMethod, P extends string>(
  method: M,
  path: P,
): OpDescriptor<M, P> =>
  ({ method, path, [OP_BRAND]: true }) as OpDescriptor<M, P>;

/** Whether a value is a branded descriptor (a leaf, as opposed to a namespace). */
export const isOp = (value: unknown): value is OpDescriptor =>
  typeof value === "object" && value !== null && OP_BRAND in value;

/** Extracts `{param}` names from a path template string, in order. */
export const extractParams = (path: string): string[] => {
  const names: string[] = [];
  const pattern = /\{([^}]+)\}/g;
  let match: RegExpExecArray | null = pattern.exec(path);
  while (match !== null) {
    names.push(match[1]!);
    match = pattern.exec(path);
  }
  return names;
};
