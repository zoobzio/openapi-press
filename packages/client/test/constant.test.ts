import { describe, expect, it } from "vitest";

import { NOOP_LOGGER } from "../src/constant";

describe("NOOP_LOGGER", () => {
  it("exposes the four log levels", () => {
    expect(NOOP_LOGGER.debug).toBeTypeOf("function");
    expect(NOOP_LOGGER.info).toBeTypeOf("function");
    expect(NOOP_LOGGER.warn).toBeTypeOf("function");
    expect(NOOP_LOGGER.error).toBeTypeOf("function");
  });

  it("discards every call, returning nothing and never throwing", () => {
    expect(NOOP_LOGGER.debug("x", { a: 1 })).toBeUndefined();
    expect(NOOP_LOGGER.info("x")).toBeUndefined();
    expect(NOOP_LOGGER.warn("x")).toBeUndefined();
    expect(NOOP_LOGGER.error("x")).toBeUndefined();
  });
});
