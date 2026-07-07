/**
 * Server-side version of get-pillar-distribution that bypasses withWorkspacePermission.
 */
import type { PillarDistribution } from "./get-pillar-distribution";

type Opts = { teamId: string; daysBack: number };

export async function getPillarDistributionDirect({ teamId, daysBack }: Opts): Promise<PillarDistribution[]> {
    void teamId;
    void daysBack;
    // TODO: replace stub once pillar config + targets are modeled.
    return [];
}