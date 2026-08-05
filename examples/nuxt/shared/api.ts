/**
 * The example SDK: plain openapi-press, no Nuxt in sight. The default export is
 * a Press — the config-accepting factory the nuxt module registers under
 * `press.clients` and builds with environment-appropriate config.
 */

import { definePress } from "openapi-press";

import type { paths } from "./schema.gen";

const { op, client } = definePress<paths>();

export default client({
  users: {
    list: op("get", "/users"),
    get: op("get", "/users/{user_id}"),
  },
});
