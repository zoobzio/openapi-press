/**
 * Test double for the `#build/openforge.mjs` manifest the module writes at
 * build time. Tests register factories on this registry to stand in for the
 * user's compiled Forge modules.
 */

export const clients: Record<string, (config?: unknown) => unknown> = {};
