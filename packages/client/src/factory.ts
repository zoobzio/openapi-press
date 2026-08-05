/**
 * The wiring core. It owns an openapi-fetch client, fires observability hooks
 * and logs, normalizes every failure through `@openapi-press/error`, and binds
 * descriptor trees into trees of `@openapi-press/call` callables. Each transport
 * call is a single attempt — behavior like retry composes above, through the
 * calls' `.with`. `makeClient` is the untyped implementation;
 * {@link defineClient} wraps it with the spec-derived types.
 */

import { defineCall } from "@openapi-press/call";
import type { PressError } from "@openapi-press/error";
import { errorFromException, errorFromResponse } from "@openapi-press/error";
import { extractParams, isOp } from "@openapi-press/spec";
import createOpenapiClient from "openapi-fetch";
import type { Middleware } from "openapi-fetch";

import { NOOP_LOGGER } from "./constant";
import type { BoundFn, ClientConfig, Logger, Runtime } from "./types";

/** The trailing options bag as seen at runtime (types are enforced at the edge). */
interface RawOptions {
  query?: Record<string, unknown>;
  body?: unknown;
  signal?: AbortSignal;
  headers?: HeadersInit;
}

type OpenapiClient = ReturnType<typeof createOpenapiClient>;

/** Builds the transport and returns the binder that turns descriptors into calls. */
const makeRuntime = (config: ClientConfig): Runtime => {
  const logger = config.logger ?? NOOP_LOGGER;

  const client = createOpenapiClient({
    baseUrl: config.baseUrl ?? "",
    ...(config.fetch ? { fetch: config.fetch } : {}),
    ...(config.headers ? { headers: config.headers } : {}),
  });

  // Observe the request lifecycle with the real Request/Response objects
  // openapi-fetch builds.
  const middleware: Middleware = {
    onRequest: async ({ request, schemaPath }) => {
      logger.debug("request", { method: request.method, path: schemaPath });
      await config.hooks?.onRequest?.({
        method: request.method,
        path: schemaPath,
        request,
      });
      return undefined;
    },
    onResponse: async ({ request, response, schemaPath }) => {
      await config.hooks?.onResponse?.({
        method: request.method,
        path: schemaPath,
        request,
        response,
      });
      return undefined;
    },
  };
  client.use(middleware);

  const method = (httpMethod: string, path: string): BoundFn => {
    const paramNames = extractParams(path);
    return async (...args: unknown[]): Promise<unknown> => {
      const pathValues = args.slice(0, paramNames.length);
      const options = (args[paramNames.length] as RawOptions | undefined) ?? {};

      const pathParams: Record<string, unknown> = {};
      paramNames.forEach((name, i) => {
        pathParams[name] = pathValues[i];
      });

      return execute(
        client,
        config,
        logger,
        httpMethod,
        path,
        pathParams,
        options,
      );
    };
  };

  return { method };
};

/**
 * Recursively replaces descriptors with bound calls, preserving nesting. Each
 * leaf becomes a `Call` carrying its descriptor as meta, so wrappers applied
 * via `.with` can read the endpoint they instrument.
 */
const bindTree = (tree: object, runtime: Runtime): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(tree)) {
    if (isOp(value)) {
      out[key] = defineCall(runtime.method(value.method, value.path), {
        method: value.method,
        path: value.path,
      });
    } else if (typeof value === "object" && value !== null) {
      out[key] = bindTree(value, runtime);
    }
  }
  return out;
};

/** A single transport attempt: build the request, run it, normalize failure. */
const execute = async (
  client: OpenapiClient,
  config: ClientConfig,
  logger: Logger,
  httpMethod: string,
  path: string,
  pathParams: Record<string, unknown>,
  options: RawOptions,
): Promise<unknown> => {
  const init: Record<string, unknown> = {
    params:
      options.query !== undefined
        ? { path: pathParams, query: options.query }
        : { path: pathParams },
  };
  if (options.body !== undefined) init.body = options.body;
  if (options.signal) init.signal = options.signal;
  if (options.headers) init.headers = options.headers;

  let error: PressError;
  try {
    // `request` is the generic (method, url, init) form of the client.
    const result = await client.request(
      httpMethod as "get",
      path as never,
      init as never,
    );
    if (result.error === undefined && result.response.ok) {
      return result.data;
    }
    error = errorFromResponse(httpMethod, path, result.response, result.error);
  } catch (cause) {
    error = errorFromException(httpMethod, path, cause);
  }

  await config.hooks?.onError?.({ method: httpMethod, path, error });
  logger.error("request failed", { method: httpMethod, path });

  const mapped = config.mapError?.(error);
  throw mapped ?? error;
};

/**
 * Binds a namespace tree of descriptors to a live runtime, returning the
 * untyped bound tree. The machine-facing counterpart to {@link defineClient}.
 */
export const makeClient = (
  tree: object,
  config: ClientConfig = {},
): Record<string, unknown> => bindTree(tree, makeRuntime(config));
