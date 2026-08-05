import { describe, expect, it } from "vitest";

import * as errors from "../src/error";

describe("openapi-press/error", () => {
  it("exposes the hierarchy", () => {
    expect(errors.PressError).toBeTypeOf("function");
    expect(errors.HttpError).toBeTypeOf("function");
    expect(errors.NotFoundError).toBeTypeOf("function");
    expect(errors.ServerError).toBeTypeOf("function");
    expect(errors.TransportError).toBeTypeOf("function");
    expect(errors.NetworkError).toBeTypeOf("function");
    expect(errors.AbortError).toBeTypeOf("function");
    expect(errors.TimeoutError).toBeTypeOf("function");
    expect(errors.CircuitOpenError).toBeTypeOf("function");
  });

  it("exposes the normalizers", () => {
    expect(errors.errorFromResponse).toBeTypeOf("function");
    expect(errors.errorFromException).toBeTypeOf("function");
    expect(errors.errorClassFor).toBeTypeOf("function");
  });
});
