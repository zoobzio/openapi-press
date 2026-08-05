/**
 * The example SDK: plain openforge, no Nuxt in sight. The default export is
 * a Forge — the config-accepting factory the nuxt module registers under
 * `openforge.clients` and builds with environment-appropriate config.
 */

import { defineForge } from "openforge";

import type { paths } from "./schema.gen";

const { op, client } = defineForge<paths>();

export default client({
  users: {
    list: op("get", "/users"),
    get: op("get", "/users/{user_id}"),
  },
});
