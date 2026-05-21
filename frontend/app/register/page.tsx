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

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authApi.register(form);
      setSuccess(response.message);
      setTimeout(() => router.push("/login"), 900);
    } catch (submitError) {
      setError(getErrorMessage(submitError, "Registration failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <Card className="space-y-6">
        <SectionHeading
          eyebrow="Create Account"
          title="Join the commerce portal"
          description="Register with the same fields expected by the backend."
        />

        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Full name</label>
            <Input
              required
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Phone</label>
            <Input
              required
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Email</label>
            <Input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-[0.14em] text-slate">Password</label>
            <Input
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            />
          </div>

          {error ? <p className="sm:col-span-2 text-sm font-semibold text-rose-700">{error}</p> : null}
          {success ? <p className="sm:col-span-2 text-sm font-semibold text-emerald-700">{success}</p> : null}

          <Button type="submit" loading={isSubmitting} className="sm:col-span-2">
            Register
          </Button>
        </form>

        <p className="text-sm text-slate">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-ink underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
