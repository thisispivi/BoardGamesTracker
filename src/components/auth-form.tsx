"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

/** Email/password login and registration form. */
export function AuthForm({
  initialMode,
  allowSignUp,
  bootstrapRequired,
}: {
  initialMode: "login" | "signup";
  allowSignUp: boolean;
  bootstrapRequired: boolean;
}) {
  const t = useTranslations("auth");
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  /** Submits credentials through Better Auth without exposing secrets to server logs. */
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();

    const result =
      mode === "signup"
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password, rememberMe: true });

    setPending(false);
    if (result.error) {
      toast.error(t("failure"));
      return;
    }

    // A full navigation ensures the freshly written session cookie is present
    // before the protected route and its proxy guard are evaluated.
    window.location.assign("/dashboard");
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {bootstrapRequired
            ? t("bootstrapTitle")
            : mode === "login"
              ? t("signIn")
              : t("createAccount")}
        </h1>
        <p className="text-muted-foreground mt-3">
          {bootstrapRequired
            ? t("bootstrapDescription")
            : mode === "login"
              ? t("signInDescription")
              : t("signUpDescription")}
        </p>
      </div>
      <form method="post" onSubmit={handleSubmit} className="space-y-5">
        {mode === "signup" && (
          <label className="block text-sm font-semibold">
            {t("name")}
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              className="bg-card mt-2 h-12 w-full rounded-xl border px-4 font-normal"
              placeholder={t("namePlaceholder")}
            />
          </label>
        )}
        <label className="block text-sm font-semibold">
          {t("email")}
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className="bg-card mt-2 h-12 w-full rounded-xl border px-4 font-normal"
            placeholder={t("emailPlaceholder")}
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("password")}
          <span className="relative mt-2 block">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              required
              minLength={12}
              maxLength={128}
              className="bg-card h-12 w-full rounded-xl border px-4 pr-12 font-normal"
              placeholder={t("passwordPlaceholder")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-2"
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </span>
        </label>
        {mode === "signup" && (
          <p className="text-muted-foreground text-xs leading-5">
            {t("passwordHelp")}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {mode === "login" ? t("signIn") : t("createAccount")}
        </Button>
      </form>
      {allowSignUp && !bootstrapRequired && (
        <p className="text-muted-foreground mt-7 text-center text-sm">
          {mode === "login" ? t("needAccount") : t("haveAccount")}{" "}
          <button
            type="button"
            className="text-primary font-bold hover:underline"
            onClick={() =>
              setMode((value) => (value === "login" ? "signup" : "login"))
            }
          >
            {mode === "login" ? t("createAccount") : t("signIn")}
          </button>
        </p>
      )}
    </>
  );
}
