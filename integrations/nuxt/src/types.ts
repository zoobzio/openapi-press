/**
 * The module's contract: the nuxt.config shape, the resolved-match shape the
 * proxy routes by, and the two runtime-config planes the module writes and
 * the runtime reads.
 */

/** Where a named client lives, where it points, and where its proxy mounts. */
export interface ForgeClientConfig {
  /**
   * Resolution path to the module whose default export is the client's
   * `Forge` factory. Aliases are allowed (`~/shared/api`).
   */
  client: string;
  /**
   * Upstream origin requests are forwarded to. Server-only — it lands in
   * private runtime config and never ships to the browser. Overridable at
   * deploy time via `NUXT_OPENFORGE_CLIENTS_<NAME>_HOST`.
   */
  host: string;
  /**
   * Route prefix the proxy mounts under. Public — it is the browser's
   * `baseUrl`, so client-side requests stay same-origin and route through
   * the proxy.
   */
  prefix: string;
}

export interface NuxtOpenforgeConfig {
  /**
   * Named clients. The name is the handle `useForge(name, forge)` resolves
   * config by; each entry stands up its own proxy.
   */
  clients?: Record<string, ForgeClientConfig>;
}

/** A configured client a request path resolved to. */
export interface MatchedClient {
  name: string;
  prefix: string;
}

/** The private runtime-config plane: upstream hosts, server-only. */
export interface HostPlane {
  clients?: Record<string, { host: string }>;
}

/** The public runtime-config plane: proxy prefixes, shipped to the browser. */
export interface PrefixPlane {
  clients?: Record<string, { prefix: string }>;
}
