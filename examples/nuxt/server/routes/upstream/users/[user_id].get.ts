/**
 * GET /upstream/users/:user_id — the mock upstream's detail endpoint. An
 * unknown id answers 404 with the top-level code/message body shape
 * openapi-press normalizes into a NotFoundError.
 */
export default defineEventHandler((event) => {
  const id = getRouterParam(event, "user_id");
  const user = USERS.find((row) => row.id === id);
  if (user === undefined) {
    setResponseStatus(event, 404);
    return { code: "USER_NOT_FOUND", message: `No user "${id}"` };
  }
  return user;
});
