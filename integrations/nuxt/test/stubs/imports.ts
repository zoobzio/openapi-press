/**
 * Test double for Nuxt's `#imports` virtual module. The runtime files resolve
 * `useRuntimeConfig`/`useRequestHeaders` through here under vitest; tests drive
 * the return values per case.
 */

import { vi } from "vitest";

export const useRuntimeConfig = vi.fn();
export const useRequestHeaders = vi.fn();
