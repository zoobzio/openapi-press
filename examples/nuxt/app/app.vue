<script setup lang="ts">
import { NotFoundError } from "openforge/error";

/*
 * The registered client, fully typed from the Forge in shared/api.ts, with
 * app wiring supplied at the call site. On the server this render calls the
 * upstream host directly; in the browser the same calls route through the
 * /api/core proxy.
 */
const log = (message: string, meta?: Record<string, unknown>) => {
  console.log(`[forge] ${message}`, meta ?? "");
};
const api = useForge("api", {
  logger: { debug: log, info: log, warn: log, error: log },
});

const { data: users } = await useAsyncData("users", () =>
  api.users.list({ query: { limit: 10 } }),
);

const { data: featured } = await useAsyncData("featured", () =>
  api.users.get("u1"),
);

/* Errors throw from the openforge hierarchy — branch on class, not status. */
const { data: missing } = await useAsyncData("missing", () =>
  api.users.get("nope").catch((error: unknown) => {
    if (error instanceof NotFoundError) return null;
    throw error;
  }),
);
</script>

<template>
  <main>
    <h1>openforge × nuxt</h1>

    <section>
      <h2>users.list()</h2>
      <ul>
        <li v-for="user in users" :key="user.id">{{ user.name }}</li>
      </ul>
    </section>

    <section>
      <h2>users.get("u1")</h2>
      <p>{{ featured?.name }}</p>
    </section>

    <section>
      <h2>users.get("nope")</h2>
      <p>{{ missing === null ? "NotFoundError, handled" : "unexpected" }}</p>
    </section>
  </main>
</template>
