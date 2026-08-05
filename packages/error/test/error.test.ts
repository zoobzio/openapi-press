import { describe, expect, it } from "vitest";

import {
  AbortError,
  BadRequestError,
  CircuitOpenError,
  ConflictError,
  ForbiddenError,
  ForgeError,
  HttpError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  TimeoutError,
  TransportError,
  UnauthorizedError,
  UnprocessableError,
} from "../src/error";

describe("ForgeError", () => {
  it("carries the request context", () => {
    const error = new ForgeError({
      message: "boom",
      method: "get",
      path: "/users/{user_id}",
    });
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ForgeError");
    expect(error.message).toBe("boom");
    expect(error.method).toBe("get");
    expect(error.path).toBe("/users/{user_id}");
  });

  it("propagates the cause when given one", () => {
    const cause = new TypeError("fetch failed");
    const error = new ForgeError({
      message: "boom",
      method: "get",
      path: "/",
      cause,
    });
    expect(error.cause).toBe(cause);
  });
});

describe("HttpError", () => {
  it("adds the response fields", () => {
    const error = new HttpError({
      status: 418,
      code: "TEAPOT",
      message: "short and stout",
      body: { code: "TEAPOT" },
      method: "get",
      path: "/",
    });
    expect(error).toBeInstanceOf(ForgeError);
    expect(error.name).toBe("HttpError");
    expect(error.status).toBe(418);
    expect(error.code).toBe("TEAPOT");
    expect(error.body).toEqual({ code: "TEAPOT" });
  });

  it("is the ancestor of every status-specific class", () => {
    const init = {
      status: 404,
      code: "HTTP_404",
      message: "nope",
      method: "get",
      path: "/",
    };
    const error = new NotFoundError(init);
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toBeInstanceOf(ForgeError);
    expect(error.name).toBe("NotFoundError");
    expect(new ServerError({ ...init, status: 503 })).toBeInstanceOf(HttpError);
  });
});

describe("TransportError", () => {
  it("is the ancestor of every no-response class", () => {
    const init = { message: "gone", method: "get", path: "/" };
    expect(new NetworkError(init)).toBeInstanceOf(TransportError);
    expect(new AbortError(init)).toBeInstanceOf(TransportError);
    expect(new TimeoutError(init)).toBeInstanceOf(TransportError);
    expect(new CircuitOpenError(init)).toBeInstanceOf(TransportError);
    expect(new NetworkError(init)).toBeInstanceOf(ForgeError);
    expect(new NetworkError(init).name).toBe("NetworkError");
  });

  it("is disjoint from HttpError", () => {
    const error = new NetworkError({
      message: "gone",
      method: "get",
      path: "/",
    });
    expect(error).not.toBeInstanceOf(HttpError);
  });
});

describe("every status-specific HttpError subclass", () => {
  const init = {
    status: 400,
    code: "HTTP_400",
    message: "m",
    method: "get",
    path: "/",
  };
  it.each([
    [BadRequestError, "BadRequestError"],
    [UnauthorizedError, "UnauthorizedError"],
    [ForbiddenError, "ForbiddenError"],
    [NotFoundError, "NotFoundError"],
    [ConflictError, "ConflictError"],
    [UnprocessableError, "UnprocessableError"],
    [RateLimitError, "RateLimitError"],
    [ServerError, "ServerError"],
  ] as const)("names itself and extends HttpError (%s)", (Cls, name) => {
    const error = new Cls(init);
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toBeInstanceOf(ForgeError);
    expect(error.name).toBe(name);
  });
});

describe("every TransportError subclass", () => {
  const init = { message: "m", method: "get", path: "/" };
  it.each([
    [NetworkError, "NetworkError"],
    [AbortError, "AbortError"],
    [CircuitOpenError, "CircuitOpenError"],
    [TimeoutError, "TimeoutError"],
  ] as const)("names itself and extends TransportError (%s)", (Cls, name) => {
    const error = new Cls(init);
    expect(error).toBeInstanceOf(TransportError);
    expect(error).toBeInstanceOf(ForgeError);
    expect(error.name).toBe(name);
  });
});
