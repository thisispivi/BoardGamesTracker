"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/Button/Button";
import { authClient } from "@/utils/authClient";

type AuthFormProps = {
  initialMode: "login" | "signup";
  allowSignUp: boolean;
  bootstrapRequired: boolean;
};

/**
 * Email/password login and registration form.
 *
 * @param root0 - Component or function properties.
 * @param root0.initialMode - The 'initialMode' property.
 * @param root0.allowSignUp - The 'allowSignUp' property.
 * @param root0.bootstrapRequired - The 'bootstrapRequired' property.
 * @returns The documented function result.
 */
export function AuthForm({
  initialMode,
  allowSignUp,
  bootstrapRequired,
}: AuthFormProps): ReactNode {
  const router = useRouter();
  const t = useTranslations("auth");
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  /**
   * Submits credentials through Better Auth without exposing secrets to server logs.
   *
   * @param event - The 'event' value.
   */
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
      toast.error(
        result.error.code === "BANNED_USER" ? t("banned") : t("failure"),
      );
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
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
      <form className="space-y-5" method="post" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className="block text-sm font-semibold">
            {t("name")}
            <input
              autoComplete="name"
              className="bg-card mt-2 h-12 w-full rounded-xl border px-4 font-normal"
              maxLength={80}
              minLength={2}
              name="name"
              placeholder={t("namePlaceholder")}
              required
            />
          </label>
        ) : null}
        <label className="block text-sm font-semibold">
          {t("email")}
          <input
            autoComplete="email"
            className="bg-card mt-2 h-12 w-full rounded-xl border px-4 font-normal"
            maxLength={254}
            name="email"
            placeholder={t("emailPlaceholder")}
            required
            type="email"
          />
        </label>
        <label className="block text-sm font-semibold">
          {t("password")}
          <span className="relative mt-2 block">
            <input
              autoComplete={
                mode === "signup" ? "new-password" : "current-password"
              }
              className="bg-card h-12 w-full rounded-xl border px-4 pr-12 font-normal"
              maxLength={128}
              minLength={12}
              name="password"
              placeholder={t("passwordPlaceholder")}
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-2"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </span>
        </label>
        {mode === "signup" ? (
          <p className="text-muted-foreground text-xs leading-5">
            {t("passwordHelp")}
          </p>
        ) : null}
        <Button className="w-full" disabled={pending} size="lg" type="submit">
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {mode === "login" ? t("signIn") : t("createAccount")}
        </Button>
      </form>
      {allowSignUp && !bootstrapRequired ? (
        <p className="text-muted-foreground mt-7 text-center text-sm">
          {mode === "login" ? t("needAccount") : t("haveAccount")}{" "}
          <button
            className="text-primary font-bold hover:underline"
            onClick={() =>
              setMode((value) => (value === "login" ? "signup" : "login"))
            }
            type="button"
          >
            {mode === "login" ? t("createAccount") : t("signIn")}
          </button>
        </p>
      ) : null}
    </>
  );
}
