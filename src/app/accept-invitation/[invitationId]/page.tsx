import { acceptInvitationAction } from "@/features/organization-member/application/use-cases/accept-invitation";
import { redirect } from "next/navigation";

export default async function AcceptInvitationPage({
  params,
}: {
  params: Promise<{ invitationId: string }>;
}) {
  const { invitationId } = await params;

  try {
    const result = await acceptInvitationAction(invitationId);
    // Redirect to workspace after successful accept — the user will now have
    // access to their active workspace switcher (file 06).
    const orgId = (result as any)?.invitation?.organizationId;
    if (orgId) {
      // Use first org's slug; if user has only one org, it will resolve correctly
      redirect(`/`);
    }
    redirect(`/`);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Undangan tidak valid atau sudah kedaluwarsa.";

    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-sm space-y-2 text-center">
          <h1 className="text-lg font-semibold">Gagal menerima undangan</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    );
  }
}
