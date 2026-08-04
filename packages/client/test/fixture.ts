/**
 * A hand-written `paths` type in the exact shape openapi-typescript emits,
 * plus fetch doubles: `jsonResponse` builds JSON responses and `makeFetch`
 * wraps a handler while recording every request the client sends.
 */

export interface User {
  id: string;
  name: string;
}

export interface paths {
  "/users": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Optional-only query, no body. */
    get: {
      parameters: {
        query?: {
          limit?: number;
          offset?: number;
        };
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            "application/json": User[];
          };
        };
      };
    };
    put?: never;
    /** Required body, no query. */
    post: {
      parameters: {
        query?: never;
        header?: never;
        path?: never;
        cookie?: never;
      };
      requestBody: {
        content: {
          "application/json": {
            name: string;
          };
        };
      };
      responses: {
        201: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            "application/json": User;
          };
        };
      };
    };
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users/{user_id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** One path param, no query, no body. */
    get: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          user_id: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            "application/json": User;
          };
        };
      };
    };
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  "/users/{user_id}/accounts/{account_id}": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /** Two path params. */
    delete: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          user_id: string;
          account_id: string;
        };
        cookie?: never;
      };
      requestBody?: never;
      responses: {
        200: {
          headers: {
            [name: string]: unknown;
          };
          content: {
            "application/json": {
              ok: boolean;
            };
          };
        };
      };
    };
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}

/** A JSON `Response` with the content type the client expects to parse. */
export const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

export interface RecordedRequest {
  method: string;
  url: string;
  headers: Headers;
  body: string | null;
}

/**
 * A fetch double: forwards every request to `handler` and records it. The
 * handler receives the 1-based attempt number so tests can vary responses
 * across retries.
 */
export const makeFetch = (
  handler: (request: Request, attempt: number) => Response | Promise<Response>,
): { fetch: typeof globalThis.fetch; requests: RecordedRequest[] } => {
  const requests: RecordedRequest[] = [];
  const fetch = async (
    input: Parameters<typeof globalThis.fetch>[0],
    init?: Parameters<typeof globalThis.fetch>[1],
  ): Promise<Response> => {
    const request = new Request(input, init);
    const body =
      request.method === "GET" || request.method === "HEAD"
        ? null
        : await request.clone().text();
    requests.push({
      method: request.method,
      url: request.url,
      headers: request.headers,
      body,
    });
    return handler(request, requests.length);
  };
  return { fetch, requests };
};
