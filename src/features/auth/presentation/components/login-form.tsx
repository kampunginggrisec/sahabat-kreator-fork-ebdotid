"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/shared/infrastructure/auth/auth-client";
import { loginSchema } from "../schemas/login.schema";
import { Input, PasswordInput } from "@/shared/presentation/components/ui/input";
import { Label } from "@/shared/presentation/components/ui/label";
import { Button } from "@/shared/presentation/components/ui/button";
import { FormError } from "@/shared/presentation/components/ui/form-error";
import Link from "next/link";
import { getFirstWorkspaceAction } from "@/features/organization/application/use-cases/get-first-workspace-server-action";

export function LoginForm() {
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
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const parsed = loginSchema.safeParse(raw);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        errors[issue.path[0] as string] = issue.message;
      });
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    const { data, error: signInError } = await authClient.signIn.email(parsed.data);
    setIsLoading(false);

    if (signInError) {
      setError(
        signInError.status === 401
          ? "Email atau password salah."
          : signInError.message ?? "Login gagal, coba lagi."
      );
      return;
    }

    // Fetch the user's first workspace (no polling!)
    const workspace = await getFirstWorkspaceAction();
    if (workspace) {
      router.push(`/${workspace.orgSlug}/${workspace.workspaceSlug}`);
      return;
    }

    // No workspace yet — user should be on /register
    // (this should never happen for login, but handle it gracefully)
    router.push("/");
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-card-foreground">Masuk</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang kembali di Sahabat Kreator.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormError message={error} />

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-bold text-card-foreground">Email</Label>
          <Input id="email" name="email" type="email" placeholder="nama@email.com" autoComplete="email" />
          {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-bold text-card-foreground">Password</Label>
          <PasswordInput id="password" name="password" placeholder="Password" autoComplete="current-password" />
          {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
        </div>

        <Button type="submit" isLoading={isLoading}>Masuk</Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="font-bold text-primary hover:underline">
          Daftar
        </Link>
      </p>
    </div>
  );
}