/**
 * A hand-written `paths` type in the exact shape openapi-typescript emits
 * (every method key present, absent ones `?: never`; `parameters` with all
 * four locations). It covers the derivation cases the package must handle:
 * zero/one/many path params, no/optional/required query, no/optional/required
 * body.
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
    /** One path param, optional body. */
    patch: {
      parameters: {
        query?: never;
        header?: never;
        path: {
          user_id: string;
        };
        cookie?: never;
      };
      requestBody?: {
        content: {
          "application/json": {
            name?: string;
          };
        };
      };
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
  "/search": {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** Required query (one required param among optional ones). */
    get: {
      parameters: {
        query: {
          q: string;
          page?: number;
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
            "application/json": {
              results: string[];
            };
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
}
