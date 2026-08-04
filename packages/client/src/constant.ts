/**
 * The built-in defaults a client runs with when its configuration says nothing.
 */

import type { Logger } from "./types";

/** A logger that discards everything; the default when none is configured. */
export const NOOP_LOGGER: Logger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};
