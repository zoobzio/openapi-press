/**
 * The mock upstream's data. In a real deployment the upstream host is a
 * separate service; here it is this app's own nitro server under `/upstream`.
 */

export interface UserRow {
  id: string;
  name: string;
}

export const USERS: UserRow[] = [
  { id: "u1", name: "Ada Lovelace" },
  { id: "u2", name: "Grace Hopper" },
  { id: "u3", name: "Margaret Hamilton" },
];
