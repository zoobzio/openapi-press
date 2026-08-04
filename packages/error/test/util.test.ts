import { describe, expect, it } from "vitest";

import {
  AbortError,
  BadRequestError,
  ConflictError,
  ForbiddenError,
  HttpError,
  NetworkError,
  NotFoundError,
  RateLimitError,
  ServerError,
  UnauthorizedError,
  UnprocessableError,
} from "../src/error";
import {
  errorClassFor,
  errorFromException,
  errorFromResponse,
} from "../src/util";

const jsonResponse = (status: number): Response =>
  new Response("{}", {
    status,
    headers: { "content-type": "application/json" },
  });

describe("errorClassFor", () => {
  it("maps specific statuses to their classes", () => {
    expect(errorClassFor(400)).toBe(BadRequestError);
    expect(errorClassFor(401)).toBe(UnauthorizedError);
    expect(errorClassFor(403)).toBe(ForbiddenError);
    expect(errorClassFor(404)).toBe(NotFoundError);
    expect(errorClassFor(409)).toBe(ConflictError);
    expect(errorClassFor(422)).toBe(UnprocessableError);
    expect(errorClassFor(429)).toBe(RateLimitError);
  });

  it("maps any 5xx to ServerError", () => {
    expect(errorClassFor(500)).toBe(ServerError);
    expect(errorClassFor(502)).toBe(ServerError);
    expect(errorClassFor(503)).toBe(ServerError);
    expect(errorClassFor(504)).toBe(ServerError);
  });

  it("falls back to HttpError for unmapped statuses", () => {
    expect(errorClassFor(402)).toBe(HttpError);
    expect(errorClassFor(418)).toBe(HttpError);
  });
});

describe("errorFromResponse", () => {
  it("builds the status-appropriate class", () => {
    const error = errorFromResponse("get", "/users", jsonResponse(404), {});
    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.status).toBe(404);
  });

  it("uses the API's code and message when the body carries them", () => {
    const error = errorFromResponse("get", "/users", jsonResponse(404), {
      code: "USER_NOT_FOUND",
      message: "no such user",
    });
    expect(error.code).toBe("USER_NOT_FOUND");
    expect(error.message).toBe("no such user");
  });

  it("synthesizes a code and message when the body carries none", () => {
    const error = errorFromResponse("get", "/users", jsonResponse(500), {});
    expect(error).toBeInstanceOf(ServerError);
    expect(error.code).toBe("HTTP_500");
    expect(error.message).toBe("Request failed with status 500");
  });

  it("tolerates a non-object body", () => {
    const error = errorFromResponse(
      "get",
      "/users",
      jsonResponse(502),
      "bad gateway",
    );
    expect(error.code).toBe("HTTP_502");
    expect(error.body).toBe("bad gateway");
  });
});

describe("errorFromException", () => {
  it("classifies aborts", () => {
    const cause = new DOMException("The operation was aborted.", "AbortError");
    const error = errorFromException("get", "/users", cause);
    expect(error).toBeInstanceOf(AbortError);
    expect(error.cause).toBe(cause);
  });

  it("classifies other transport failures as network errors", () => {
    const error = errorFromException(
      "get",
      "/users",
      new TypeError("fetch failed"),
    );
    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toBe("fetch failed");
  });

  it("tolerates non-Error causes", () => {
    const error = errorFromException("get", "/users", "boom");
    expect(error).toBeInstanceOf(NetworkError);
    expect(error.message).toBe("Network request failed");
  });
});
