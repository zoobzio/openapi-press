import { describe, expectTypeOf, it } from "vitest";

import type { HttpError, NotFoundError } from "../src/error";
import type {
  ForgeErrorInit,
  HttpErrorClass,
  HttpErrorInit,
} from "../src/types";

describe("ForgeErrorInit", () => {
  it("requires the request context and admits an optional cause", () => {
    expectTypeOf<ForgeErrorInit["message"]>().toEqualTypeOf<string>();
    expectTypeOf<ForgeErrorInit["method"]>().toEqualTypeOf<string>();
    expectTypeOf<ForgeErrorInit["path"]>().toEqualTypeOf<string>();
    expectTypeOf<ForgeErrorInit["cause"]>().toEqualTypeOf<unknown>();
  });
});

describe("HttpErrorInit", () => {
  it("extends the base init with the response fields", () => {
    expectTypeOf<HttpErrorInit>().toExtend<ForgeErrorInit>();
    expectTypeOf<HttpErrorInit["status"]>().toEqualTypeOf<number>();
    expectTypeOf<HttpErrorInit["code"]>().toEqualTypeOf<string>();
    expectTypeOf<HttpErrorInit["body"]>().toEqualTypeOf<unknown>();
  });
});

describe("HttpErrorClass", () => {
  it("constructs an HttpError from an HttpErrorInit", () => {
    expectTypeOf<HttpErrorClass>().toEqualTypeOf<
      new (init: HttpErrorInit) => HttpError
    >();
  });

  it("is satisfied by the concrete status subclasses", () => {
    expectTypeOf<typeof NotFoundError>().toExtend<HttpErrorClass>();
  });
});
