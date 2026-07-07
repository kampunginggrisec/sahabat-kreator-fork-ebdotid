"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/shared/infrastructure/auth/auth-client";
import { registerSchema } from "../schemas/register.schema";
import { Input, PasswordInput } from "@/shared/presentation/components/ui/input";
import { Label } from "@/shared/presentation/components/ui/label";
import { Button } from "@/shared/presentation/components/ui/button";
import { FormError } from "@/shared/presentation/components/ui/form-error";
import Link from "next/link";
import { getFirstWorkspaceAction } from "@/features/organization/application/use-cases/get-first-workspace-server-action";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const parsed = registerSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        errors[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    const { data, error: signUpError } = await authClient.signUp.email(parsed.data);
    setIsLoading(false);

    if (signUpError) {
      setError(signUpError.message ?? "Registrasi gagal, coba lagi.");
      return;
    }

    // DB hook di auth.ts already auto-creates org + workspace when the user is created.
    // No more polling — getFirstWorkspaceAction is a single DB query that resolves
    // synchronously from the user's perspective (auto-created org should be there
    // since the create user hook ran in the same transaction-like context).

    const workspace = await getFirstWorkspaceAction();
    if (workspace) {
      router.push(`/${workspace.orgSlug}/${workspace.workspaceSlug}`);
      return;
    }

    // Org not yet created — retry with short exponential backoff (max 1s).
    // This handles the rare case where the auto-create hook is slightly delayed.
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 200));
      const retry = await getFirstWorkspaceAction();
      if (retry) {
        router.push(`/${retry.orgSlug}/${retry.workspaceSlug}`);
        return;
      }
    }

    // Final fallback — stay on page and let the user navigate
    router.push("/");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-card-foreground">Buat akun</h1>
        <p className="text-sm text-muted-foreground">
          Mulai kelola konten kamu bersama Sahabat Kreator.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormError message={error} />

        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-bold text-card-foreground">Nama</Label>
          <Input id="name" name="name" placeholder="Nama lengkap" autoComplete="name" />
          {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-bold text-card-foreground">Email</Label>
          <Input id="email" name="email" type="email" placeholder="nama@email.com" autoComplete="email" />
          {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-bold text-card-foreground">Password</Label>
          <PasswordInput id="password" name="password" placeholder="Minimal 8 karakter" autoComplete="new-password" />
          {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
        </div>

        <Button type="submit" isLoading={isLoading}>Daftar</Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-bold text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </div>
  );
}
