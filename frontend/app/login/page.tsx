"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SectionHeading } from "@/components/ui/section-heading";
import { authApi } from "@/lib/api/services";
import { getErrorMessage } from "@/lib/api/client";
import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await authApi.login(form);
      auth.setLoginSession(response);
      router.push(response.user.role === "admin" ? "/admin" : "/");
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Login failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Card className="space-y-6">
        <SectionHeading
          eyebrow="Welcome Back"
          title="Log in to your account"
          description="Use your backend account credentials."
        />

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Email</label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Password</label>
            <Input
              type="password"
              required
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </div>

          {error ? <p className="text-sm font-semibold text-rose-700">{error}</p> : null}

          <Button type="submit" loading={isSubmitting} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="text-sm text-slate">
          No account yet?{" "}
          <Link href="/register" className="font-semibold text-ink underline">
            Register now
          </Link>
        </p>
      </Card>
    </div>
  );
}
