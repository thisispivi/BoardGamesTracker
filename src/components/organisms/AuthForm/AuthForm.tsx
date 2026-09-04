"use client";

import { Eye, EyeOff, LoaderCircle, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/Button/Button";
import { authClient } from "@/utils/authClient";

/** Authentication modes available from the public account form. */
type AuthMode = "forgot" | "login" | "signup";

/** Completed email-based actions displayed without exposing account existence. */
type AuthNotice = "passwordReset" | "verification";

/**
 * Maps a Better Auth failure code onto a translated, non-revealing message.
 *
 * Unrecognized codes fall back to the generic failure text so upstream wording
 * never reaches the account owner.
 *
 * @param code - Failure code reported by the authentication client.
 * @returns The message catalog key describing the failure.
 */
function authErrorKey(
  code: string | undefined,
): "banned" | "failure" | "signUpDisabled" {
  if (code === "BANNED_USER") return "banned";
  if (code === "SIGN_UP_DISABLED") return "signUpDisabled";
  return "failure";
}

/** Authentication modes available for the current installation state. */
type AuthFormProps = {
  initialMode: "login" | "signup";
  allowSignUp: boolean;
  bootstrapRequired: boolean;
  mailEnabled: boolean;
};

/**
 * Email/password login, registration, and recovery form.
 *
 * @param root0 - Properties that configure auth form.
 * @param root0.initialMode - Authentication mode shown when the form opens.
 * @param root0.allowSignUp - Whether the sign-up mode is available.
 * @param root0.bootstrapRequired - Whether the first administrator account still needs to be created.
 * @param root0.mailEnabled - Whether SMTP-backed account actions are available.
 * @returns The rendered auth form.
 */
export function AuthForm({
  initialMode,
  allowSignUp,
  bootstrapRequired,
  mailEnabled,
}: AuthFormProps): ReactNode {
  const router = useRouter();
  const t = useTranslations("auth");
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [noticeEmail, setNoticeEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);

  /**
   * Returns the form to sign-in mode and clears completed-action notices.
   *
   * @returns Nothing.
   */
  function showSignIn(): void {
    setNotice(null);
    setMode("login");
  }

  /**
   * Sends another verification message without revealing delivery details.
   *
   * @returns A promise that resolves after Better Auth accepts the request.
   */
  async function resendVerification(): Promise<void> {
    if (!noticeEmail) return;
    setPending(true);
    await authClient.sendVerificationEmail({
      email: noticeEmail,
      callbackURL: "/dashboard",
    });
    setPending(false);
    toast.success(t("verificationResent"));
  }

  /**
   * Submits credentials through Better Auth without exposing secrets to server logs.
   *
   * @param event - Form submission event whose default navigation is suppressed.
   * @returns A promise that resolves after the authentication request finishes.
   */
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();

    if (mode === "forgot") {
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      setNoticeEmail(email);
      setNotice("passwordReset");
      setPending(false);
      return;
    }

    const password = String(form.get("password") ?? "");
    const name = String(form.get("name") ?? "").trim();
    const result =
      mode === "signup"
        ? await authClient.signUp.email({
            email,
            password,
            name,
            callbackURL: "/dashboard",
          })
        : await authClient.signIn.email({ email, password, rememberMe: true });

    setPending(false);
    if (result.error) {
      if (mailEnabled && result.error.code === "EMAIL_NOT_VERIFIED") {
        setNoticeEmail(email);
        setNotice("verification");
        return;
      }
      toast.error(t(authErrorKey(result.error.code)));
      return;
    }

    if (mode === "signup" && mailEnabled) {
      setNoticeEmail(email);
      setNotice("verification");
      return;
    }

    router.replace("/dashboard");
  }

  if (notice) {
    return (
      <div className="py-2 text-center">
        <span className="bg-primary/10 text-primary mx-auto grid size-14 place-items-center rounded-full">
          <MailCheck aria-hidden="true" className="size-6" />
        </span>
        <h1 className="font-display mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
          {notice === "verification"
            ? t("verificationTitle")
            : t("resetSentTitle")}
        </h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {notice === "verification"
            ? t("verificationBody")
            : t("resetSentBody")}
        </p>
        {notice === "verification" ? (
          <Button
            className="mt-6 w-full"
            disabled={pending}
            onClick={resendVerification}
            type="button"
            variant="secondary"
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {t("resendVerification")}
          </Button>
        ) : null}
        <button
          className="text-primary mt-5 text-sm font-bold hover:underline"
          onClick={showSignIn}
          type="button"
        >
          {t("backToSignIn")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {bootstrapRequired
            ? t("bootstrapTitle")
            : mode === "login"
              ? t("signIn")
              : mode === "forgot"
                ? t("forgotTitle")
                : t("createAccount")}
        </h1>
        <p className="text-muted-foreground mt-3">
          {bootstrapRequired
            ? t("bootstrapDescription")
            : mode === "login"
              ? t("signInDescription")
              : mode === "forgot"
                ? t("forgotDescription")
                : t("signUpDescription")}
        </p>
      </div>
      <form className="space-y-5" method="post" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className="block text-sm font-semibold">
            {t("name")}
            <input
              autoComplete="name"
              className="bg-card mt-2 h-12 w-full rounded-lg border px-4 font-normal"
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
            className="bg-card mt-2 h-12 w-full rounded-lg border px-4 font-normal"
            maxLength={254}
            name="email"
            placeholder={t("emailPlaceholder")}
            required
            type="email"
          />
        </label>
        {mode !== "forgot" ? (
          <label className="block text-sm font-semibold">
            {t("password")}
            <span className="relative mt-2 block">
              <input
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                className="bg-card h-12 w-full rounded-lg border px-4 pr-12 font-normal"
                maxLength={128}
                minLength={12}
                name="password"
                placeholder={t("passwordPlaceholder")}
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                aria-label={
                  showPassword ? t("hidePassword") : t("showPassword")
                }
                className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-2"
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
        ) : null}
        {mode === "signup" ? (
          <p className="text-muted-foreground text-xs leading-5">
            {t("passwordHelp")}
          </p>
        ) : null}
        {mode === "login" && mailEnabled ? (
          <button
            className="text-primary -mt-2 block text-sm font-bold hover:underline"
            onClick={() => setMode("forgot")}
            type="button"
          >
            {t("forgotPassword")}
          </button>
        ) : null}
        <Button className="w-full" disabled={pending} size="lg" type="submit">
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {mode === "login"
            ? t("signIn")
            : mode === "forgot"
              ? t("sendResetLink")
              : t("createAccount")}
        </Button>
      </form>
      {mode === "forgot" ? (
        <p className="text-muted-foreground mt-7 text-center text-sm">
          <button
            className="text-primary font-bold hover:underline"
            onClick={showSignIn}
            type="button"
          >
            {t("backToSignIn")}
          </button>
        </p>
      ) : allowSignUp && !bootstrapRequired ? (
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
