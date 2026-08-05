import { describe, expect, it } from "vitest";

import { STATUS_ERRORS } from "../src/constant";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  UnprocessableError,
} from "../src/error";

describe("STATUS_ERRORS", () => {
  it("maps each special-cased status to its error class", () => {
    expect(STATUS_ERRORS[400]).toBe(BadRequestError);
    expect(STATUS_ERRORS[401]).toBe(UnauthorizedError);
    expect(STATUS_ERRORS[403]).toBe(ForbiddenError);
    expect(STATUS_ERRORS[404]).toBe(NotFoundError);
    expect(STATUS_ERRORS[409]).toBe(ConflictError);
    expect(STATUS_ERRORS[422]).toBe(UnprocessableError);
    expect(STATUS_ERRORS[429]).toBe(RateLimitError);
  });

  it("carries only the special-cased statuses; ranges resolve elsewhere", () => {
    expect(Object.keys(STATUS_ERRORS)).toEqual([
      "400",
      "401",
      "403",
      "404",
      "409",
      "422",
      "429",
    ]);
    expect(STATUS_ERRORS[418]).toBeUndefined();
    expect(STATUS_ERRORS[500]).toBeUndefined();
  });
});
