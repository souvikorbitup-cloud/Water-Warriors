export const ROLES = ["admin"] as const;

export type Role = (typeof ROLES)[number];

export const DEFAULT_ROLE: Role = "admin";

export function isValidRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}
