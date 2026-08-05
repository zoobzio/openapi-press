/** GET /upstream/users — the mock upstream's list endpoint. */
export default defineEventHandler((event) => {
  const { limit } = getQuery(event);
  const max = typeof limit === "string" ? Number(limit) : USERS.length;
  return USERS.slice(0, max);
});
