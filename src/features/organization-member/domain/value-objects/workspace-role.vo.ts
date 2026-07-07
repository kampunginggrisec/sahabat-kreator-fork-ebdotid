import { workspaceRoleEnum } from "@/shared/infrastructure/database/schema/enum-schema";

export const WORKSPACE_ROLES = workspaceRoleEnum.enumValues;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const WORKSPACE_ROLE_LABELS: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

/** Role rank (higher = more privileged). */
export const WORKSPACE_ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

/**
 * Returns true if the rank of `actor` is strictly higher than `target`.
 * Used to prevent lower-ranked members from editing higher-ranked ones.
 * Owner (4) is excluded from being demoted; demotion requires a separate owner.
 */
export function outranks(actor: WorkspaceRole, target: WorkspaceRole): boolean {
  return WORKSPACE_ROLE_RANK[actor] > WORKSPACE_ROLE_RANK[target];
}
