import { PlatformBlock } from "@/features/social-integration/presentation/blocks/platform-block";
import { SOCIAL_PLATFORM_REGISTRY } from "@/features/social-integration/presentation/constants/platform-registry";
import { getConnectedAccountsAction } from "@/features/social-integration/application/use-cases/get-connected-accounts";

type Props = {
    params: Promise<{ orgSlug: string; workspaceSlug: string }>;
};

// Revalidate this page every 5 minutes. Connections rarely change
// during a normal user session, so per-user dynamic rendering adds cost
// without benefit. Mutations call `revalidatePath` to force invalidation.
export const revalidate = 300;

export default async function SocialIntegrationPage({ params }: Props) {
    const { orgSlug, workspaceSlug } = await params;

    const { connections: allConnections } = await getConnectedAccountsAction();

    const connectionsByPlatform: Record<string, typeof allConnections> = {};
    for (const conn of allConnections) {
        if (!connectionsByPlatform[conn.platform]) {
            connectionsByPlatform[conn.platform] = [];
        }
        connectionsByPlatform[conn.platform].push(conn);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl font-semibold">Integrasi Sosial</h1>
                <p className="text-sm text-muted-foreground">Hubungkan akun media sosial Anda</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {Object.entries(SOCIAL_PLATFORM_REGISTRY).map(([platform, _config]) => {
                    const connections = connectionsByPlatform[platform] ?? [];
                    return (
                        <PlatformBlock
                            key={platform}
                            platform={platform}
                            orgSlug={orgSlug}
                            workspaceSlug={workspaceSlug}
                            connections={connections}
                        />
                    );
                })}
            </div>
        </div>
    );
}