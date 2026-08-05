import {
  AbortError,
  CircuitOpenError,
  NotFoundError,
  ServerError,
  TimeoutError,
  UnauthorizedError,
} from "@openapi-press/error";
import { describe, expect, it } from "vitest";

import { defineCall } from "../src/service";
import {
  withCache,
  withCircuitBreaker,
  withDedupe,
  withFallback,
  withReauth,
  withRetry,
  withTimeout,
} from "../src/wrapper";
import { META, flaky } from "./fixture";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const serverError = (): ServerError =>
  new ServerError({
    status: 503,
    code: "HTTP_503",
    message: "unavailable",
    method: META.method,
    path: META.path,
  });

describe("withRetry", () => {
  it("retries transient failures until an attempt succeeds", async () => {
    const { handler, calls } = flaky(2, "ok");
    const call = defineCall(handler, META).with(withRetry({ backoffMs: 1 }));
    await expect(call()).resolves.toBe("ok");
    expect(calls()).toBe(3);
  });

  it("gives up after the configured attempts", async () => {
    const { handler, calls } = flaky(Infinity, "never");
    const call = defineCall(handler, META).with(
      withRetry({ attempts: 2, backoffMs: 1 }),
    );
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    expect(calls()).toBe(3);
  });

  it("refuses methods outside the policy", async () => {
    const { handler, calls } = flaky(1, "ok");
    const call = defineCall(handler, {
      method: "post",
      path: "/users",
    }).with(withRetry({ backoffMs: 1 }));
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    expect(calls()).toBe(1);
  });

  it("refuses errors the policy's predicate rejects", async () => {
    let calls = 0;
    const call = defineCall(async () => {
      calls++;
      throw new AbortError({ message: "cancelled", method: "get", path: "/" });
    }, META).with(withRetry({ backoffMs: 1 }));
    await expect(call()).rejects.toBeInstanceOf(AbortError);
    expect(calls).toBe(1);
  });

  it("accepts a custom predicate", async () => {
    let calls = 0;
    const call = defineCall(async () => {
      calls++;
      if (calls === 1) throw new Error("flaky in a custom way");
      return "ok";
    }, META).with(withRetry({ backoffMs: 1, on: () => true }));
    await expect(call()).resolves.toBe("ok");
    expect(calls).toBe(2);
  });
});

describe("withTimeout", () => {
  it("rejects with TimeoutError when the budget runs out", async () => {
    const call = defineCall(() => new Promise<string>(() => {}), META).with(
      withTimeout(10),
    );
    const error = await call().then(
      () => {
        throw new Error("expected rejection");
      },
      (thrown: unknown) => thrown as TimeoutError,
    );
    expect(error).toBeInstanceOf(TimeoutError);
    expect(error.method).toBe("get");
    expect(error.path).toBe("/users/{user_id}");
  });

  it("resolves when the call beats the budget", async () => {
    const call = defineCall(async () => "fast", META).with(withTimeout(1000));
    await expect(call()).resolves.toBe("fast");
  });

  it("passes the call's own failure through", async () => {
    const call = defineCall(async () => {
      throw new Error("own failure");
    }, META).with(withTimeout(1000));
    await expect(call()).rejects.toThrow("own failure");
  });

  it("bounds the whole retried sequence when placed outside retry", async () => {
    const { handler } = flaky(Infinity, "never");
    const call = defineCall(handler, META).with(
      withTimeout(20),
      withRetry({ attempts: 1000, backoffMs: 15 }),
    );
    await expect(call()).rejects.toBeInstanceOf(TimeoutError);
  });
});

describe("withDedupe", () => {
  it("shares one in-flight promise among identical concurrent calls", async () => {
    let calls = 0;
    let release!: (value: string) => void;
    const call = defineCall(() => {
      calls++;
      return new Promise<string>((resolve) => {
        release = resolve;
      });
    }, META).with(withDedupe());
    const first = call();
    const second = call();
    release("ok");
    await expect(first).resolves.toBe("ok");
    await expect(second).resolves.toBe("ok");
    expect(calls).toBe(1);
  });

  it("separates calls with different args", async () => {
    let calls = 0;
    const call = defineCall(async (id: string) => {
      calls++;
      return id;
    }, META).with(withDedupe());
    await Promise.all([call("a"), call("b")]);
    expect(calls).toBe(2);
  });

  it("runs fresh once the shared promise settles", async () => {
    let calls = 0;
    const call = defineCall(async () => ++calls, META).with(withDedupe());
    await call();
    await call();
    expect(calls).toBe(2);
  });

  it("shares and clears rejections too", async () => {
    let calls = 0;
    const call = defineCall(async () => {
      calls++;
      throw serverError();
    }, META).with(withDedupe());
    const first = call();
    const second = call();
    await expect(first).rejects.toBeInstanceOf(ServerError);
    await expect(second).rejects.toBeInstanceOf(ServerError);
    expect(calls).toBe(1);
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    expect(calls).toBe(2);
  });
});

describe("withCache", () => {
  it("returns the cached result within the window", async () => {
    let calls = 0;
    const call = defineCall(async () => ++calls, META).with(withCache(1000));
    await expect(call()).resolves.toBe(1);
    await expect(call()).resolves.toBe(1);
    expect(calls).toBe(1);
  });

  it("keys entries per invocation args", async () => {
    const call = defineCall(async (id: string) => `v:${id}`, META).with(
      withCache(1000),
    );
    await expect(call("a")).resolves.toBe("v:a");
    await expect(call("b")).resolves.toBe("v:b");
  });

  it("refetches once the window passes", async () => {
    let calls = 0;
    const call = defineCall(async () => ++calls, META).with(withCache(20));
    await expect(call()).resolves.toBe(1);
    await sleep(30);
    await expect(call()).resolves.toBe(2);
  });

  it("never caches failures", async () => {
    let calls = 0;
    const call = defineCall(async () => {
      calls++;
      if (calls === 1) throw serverError();
      return "ok";
    }, META).with(withCache(1000));
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    await expect(call()).resolves.toBe("ok");
  });
});

describe("withCircuitBreaker", () => {
  it("opens after the configured consecutive failures", async () => {
    const { handler, calls } = flaky(Infinity, "never");
    const call = defineCall(handler, META).with(
      withCircuitBreaker({ failures: 2, cooldownMs: 1000 }),
    );
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    await expect(call()).rejects.toBeInstanceOf(CircuitOpenError);
    expect(calls()).toBe(2);
  });

  it("closes again when the probe succeeds", async () => {
    const { handler, calls } = flaky(1, "ok");
    const call = defineCall(handler, META).with(
      withCircuitBreaker({ failures: 1, cooldownMs: 20 }),
    );
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    await expect(call()).rejects.toBeInstanceOf(CircuitOpenError);
    await sleep(30);
    await expect(call()).resolves.toBe("ok");
    await expect(call()).resolves.toBe("ok");
    expect(calls()).toBe(3);
  });

  it("reopens when the probe fails", async () => {
    const { handler, calls } = flaky(Infinity, "never");
    const call = defineCall(handler, META).with(
      withCircuitBreaker({ failures: 1, cooldownMs: 20 }),
    );
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    await sleep(30);
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    await expect(call()).rejects.toBeInstanceOf(CircuitOpenError);
    expect(calls()).toBe(2);
  });

  it("ignores errors the policy's predicate rejects", async () => {
    const call = defineCall(async () => {
      throw new NotFoundError({
        status: 404,
        code: "HTTP_404",
        message: "nope",
        method: META.method,
        path: META.path,
      });
    }, META).with(withCircuitBreaker({ failures: 1, cooldownMs: 1000 }));
    await expect(call()).rejects.toBeInstanceOf(NotFoundError);
    await expect(call()).rejects.toBeInstanceOf(NotFoundError);
  });

  it("shares state when one instance instruments several calls", async () => {
    const breaker = withCircuitBreaker({ failures: 1, cooldownMs: 1000 });
    const failing = defineCall(async () => {
      throw serverError();
    }, META).with(breaker);
    const healthy = defineCall(async () => "ok", {
      method: "get",
      path: "/other",
    }).with(breaker);
    await expect(failing()).rejects.toBeInstanceOf(ServerError);
    await expect(healthy()).rejects.toBeInstanceOf(CircuitOpenError);
  });
});

describe("withFallback", () => {
  it("passes success through", async () => {
    const call = defineCall(async () => "real", META).with(
      withFallback(() => "fallback"),
    );
    await expect(call()).resolves.toBe("real");
  });

  it("resolves with the fallback on failure", async () => {
    const call = defineCall(async (): Promise<string> => {
      throw serverError();
    }, META).with(withFallback(() => "fallback"));
    await expect(call()).resolves.toBe("fallback");
  });

  it("hands the fallback the error and meta", async () => {
    const call = defineCall(async (): Promise<string> => {
      throw serverError();
    }, META).with(
      withFallback((error, meta) => `${(error as Error).name} ${meta.path}`),
    );
    await expect(call()).resolves.toBe("ServerError /users/{user_id}");
  });
});

describe("withReauth", () => {
  const unauthorized = (): UnauthorizedError =>
    new UnauthorizedError({
      status: 401,
      code: "HTTP_401",
      message: "expired",
      method: META.method,
      path: META.path,
    });

  it("refreshes once and replays on UnauthorizedError", async () => {
    let token = "stale";
    const call = defineCall(async () => {
      if (token !== "fresh") throw unauthorized();
      return "ok";
    }, META).with(
      withReauth(() => {
        token = "fresh";
      }),
    );
    await expect(call()).resolves.toBe("ok");
  });

  it("leaves other errors alone", async () => {
    let refreshed = false;
    const call = defineCall(async () => {
      throw serverError();
    }, META).with(
      withReauth(() => {
        refreshed = true;
      }),
    );
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    expect(refreshed).toBe(false);
  });

  it("propagates a second UnauthorizedError without another refresh", async () => {
    let refreshes = 0;
    const call = defineCall(async () => {
      throw unauthorized();
    }, META).with(
      withReauth(() => {
        refreshes++;
      }),
    );
    await expect(call()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(refreshes).toBe(1);
  });

  it("propagates a failed refresh", async () => {
    const call = defineCall(async () => {
      throw unauthorized();
    }, META).with(
      withReauth(() => {
        throw new Error("refresh failed");
      }),
    );
    await expect(call()).rejects.toThrow("refresh failed");
  });
});
