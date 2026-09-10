"use client";

import { Loader2Icon } from "lucide-react";
import { signIn } from "next-auth/react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiResult } from "@/lib/api-response";
import { registerSchema } from "@/lib/validations/auth";

type Field = "name" | "email" | "password";
type FieldErrors = Partial<Record<Field, string>>;

const FIELDS: readonly Field[] = ["name", "email", "password"];

export function RegisterForm({ callbackUrl }: { callbackUrl: Route }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const values = {
      name: form.get("name"),
      email: form.get("email"),
      password: form.get("password"),
    };

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (FIELDS.includes(field as Field)) {
          errors[field as Field] ??= issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }

    setPending(true);

    let result: ApiResult<unknown>;
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      result = (await response.json()) as ApiResult<unknown>;
    } catch {
      setFormError("Could not reach the server. Check your connection and try again.");
      setPending(false);
      return;
    }

    if (!result.success) {
      // Field-level messages from the server take precedence over the banner.
      if (result.error.fields) {
        const errors: FieldErrors = {};
        for (const [key, messages] of Object.entries(result.error.fields)) {
          if (FIELDS.includes(key as Field) && messages[0]) {
            errors[key as Field] = messages[0];
          }
        }
        setFieldErrors(errors);
      }
      setFormError(result.error.message);
      setPending(false);
      return;
    }

    // Registration succeeded — sign the new account straight in.
    const signInResult = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (!signInResult || signInResult.error) {
      setFormError("Your account was created, but sign-in failed. Please sign in manually.");
      setPending(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {formError ? (
        <div
          role="alert"
          className="border-status-danger/25 bg-status-danger/10 text-status-danger rounded-md border px-3 py-2.5 text-sm"
        >
          {formError}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          required
          aria-invalid={Boolean(fieldErrors.name)}
          aria-describedby={fieldErrors.name ? "name-error" : undefined}
        />
        {fieldErrors.name ? (
          <p id="name-error" className="text-status-danger text-xs">
            {fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email ? (
          <p id="email-error" className="text-status-danger text-xs">
            {fieldErrors.email}
          </p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
        />
        {fieldErrors.password ? (
          <p id="password-error" className="text-status-danger text-xs">
            {fieldErrors.password}
          </p>
        ) : (
          <p id="password-hint" className="text-text-tertiary text-xs">
            At least 8 characters.
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? <Loader2Icon className="animate-spin" aria-hidden="true" /> : null}
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
