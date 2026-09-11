/**
 * The columns of a `DbGroup`. The database calls the invite code
 * invite_token, so it is selected as invite_code.
 */
export const DB_GROUP_COLUMNS =
  "id, name, currency, invite_code:invite_token, created_by, created_at"
