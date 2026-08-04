import { AbortError, ServerError, TimeoutError } from "@openforge/error";
import { describe, expect, it } from "vitest";

import { defineCall } from "../src/service";
import { retry, timeout } from "../src/wrapper";
import { META, flaky } from "./fixture";

describe("retry", () => {
  it("retries transient failures until an attempt succeeds", async () => {
    const { handler, calls } = flaky(2, "ok");
    const call = defineCall(handler, META).with(retry({ backoffMs: 1 }));
    await expect(call()).resolves.toBe("ok");
    expect(calls()).toBe(3);
  });

  it("gives up after the configured attempts", async () => {
    const { handler, calls } = flaky(Infinity, "never");
    const call = defineCall(handler, META).with(
      retry({ attempts: 2, backoffMs: 1 }),
    );
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    expect(calls()).toBe(3);
  });

  it("refuses methods outside the policy", async () => {
    const { handler, calls } = flaky(1, "ok");
    const call = defineCall(handler, {
      method: "post",
      path: "/users",
    }).with(retry({ backoffMs: 1 }));
    await expect(call()).rejects.toBeInstanceOf(ServerError);
    expect(calls()).toBe(1);
  });

  it("compares methods case-insensitively", async () => {
    const { handler, calls } = flaky(1, "ok");
    const call = defineCall(handler, { method: "get", path: "/" }).with(
      retry({ backoffMs: 1 }),
    );
    await expect(call()).resolves.toBe("ok");
    expect(calls()).toBe(2);
  });

  it("refuses errors the policy's predicate rejects", async () => {
    let calls = 0;
    const call = defineCall(async () => {
      calls++;
      throw new AbortError({ message: "cancelled", method: "get", path: "/" });
    }, META).with(retry({ backoffMs: 1 }));
    await expect(call()).rejects.toBeInstanceOf(AbortError);
    expect(calls).toBe(1);
  });

  it("accepts a custom predicate", async () => {
    let calls = 0;
    const call = defineCall(async () => {
      calls++;
      if (calls === 1) throw new Error("flaky in a custom way");
      return "ok";
    }, META).with(retry({ backoffMs: 1, on: () => true }));
    await expect(call()).resolves.toBe("ok");
    expect(calls).toBe(2);
  });
});

describe("timeout", () => {
  it("rejects with TimeoutError when the budget runs out", async () => {
    const call = defineCall(() => new Promise<string>(() => {}), META).with(
      timeout(10),
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
    const call = defineCall(async () => "fast", META).with(timeout(1000));
    await expect(call()).resolves.toBe("fast");
  });

  it("passes the call's own failure through", async () => {
    const call = defineCall(async () => {
      throw new Error("own failure");
    }, META).with(timeout(1000));
    await expect(call()).rejects.toThrow("own failure");
  });

  it("bounds the whole retried sequence when placed outside retry", async () => {
    const { handler } = flaky(Infinity, "never");
    const call = defineCall(handler, META).with(
      timeout(20),
      retry({ attempts: 1000, backoffMs: 15 }),
    );
    await expect(call()).rejects.toBeInstanceOf(TimeoutError);
  });
});
