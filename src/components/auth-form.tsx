"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

const authCopy = {
  en: {
    signIn: "Sign in",
    createAccount: "Create account",
    signInDescription: "Enter your email and password.",
    signUpDescription: "Enter your details to get started.",
    bootstrapTitle: "Create administrator",
    bootstrapDescription:
      "Set up the first account. It will have full administrator access.",
    name: "Name",
    namePlaceholder: "Alex Morgan",
    email: "Email",
    emailPlaceholder: "alex@example.com",
    password: "Password",
    passwordPlaceholder: "At least 12 characters",
    passwordHelp:
      "Use 12–128 characters. A unique password from a password manager is best.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    needAccount: "Need an account?",
    haveAccount: "Already have an account?",
    failure: "Authentication failed. Please try again.",
  },
  it: {
    signIn: "Accedi",
    createAccount: "Crea account",
    signInDescription: "Inserisci email e password.",
    signUpDescription: "Inserisci i tuoi dati per iniziare.",
    bootstrapTitle: "Crea amministratore",
    bootstrapDescription:
      "Configura il primo account. Avrà accesso completo come amministratore.",
    name: "Nome",
    namePlaceholder: "Alex Morgan",
    email: "Email",
    emailPlaceholder: "alex@example.com",
    password: "Password",
    passwordPlaceholder: "Almeno 12 caratteri",
    passwordHelp:
      "Usa 12–128 caratteri. È consigliata una password univoca generata da un password manager.",
    showPassword: "Mostra password",
    hidePassword: "Nascondi password",
    needAccount: "Non hai un account?",
    haveAccount: "Hai già un account?",
    failure: "Autenticazione non riuscita. Riprova.",
  },
} as const;

/** Email/password login and registration form. */
export function AuthForm({
  initialMode,
  locale,
  allowSignUp,
  bootstrapRequired,
}: {
  initialMode: "login" | "signup";
  locale: "en" | "it";
  allowSignUp: boolean;
  bootstrapRequired: boolean;
}) {
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const copy = authCopy[locale];

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
      toast.error(result.error.message ?? copy.failure);
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
            ? copy.bootstrapTitle
            : mode === "login"
              ? copy.signIn
              : copy.createAccount}
        </h1>
        <p className="text-muted-foreground mt-3">
          {bootstrapRequired
            ? copy.bootstrapDescription
            : mode === "login"
              ? copy.signInDescription
              : copy.signUpDescription}
        </p>
      </div>
      <form method="post" onSubmit={handleSubmit} className="space-y-5">
        {mode === "signup" && (
          <label className="block text-sm font-semibold">
            {copy.name}
            <input
              name="name"
              autoComplete="name"
              required
              minLength={2}
              maxLength={80}
              className="bg-card mt-2 h-12 w-full rounded-xl border px-4 font-normal"
              placeholder={copy.namePlaceholder}
            />
          </label>
        )}
        <label className="block text-sm font-semibold">
          {copy.email}
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className="bg-card mt-2 h-12 w-full rounded-xl border px-4 font-normal"
            placeholder={copy.emailPlaceholder}
          />
        </label>
        <label className="block text-sm font-semibold">
          {copy.password}
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
              placeholder={copy.passwordPlaceholder}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-2"
              aria-label={showPassword ? copy.hidePassword : copy.showPassword}
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
            {copy.passwordHelp}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending && <LoaderCircle className="size-4 animate-spin" />}
          {mode === "login" ? copy.signIn : copy.createAccount}
        </Button>
      </form>
      {allowSignUp && !bootstrapRequired && (
        <p className="text-muted-foreground mt-7 text-center text-sm">
          {mode === "login" ? copy.needAccount : copy.haveAccount}{" "}
          <button
            type="button"
            className="text-primary font-bold hover:underline"
            onClick={() =>
              setMode((value) => (value === "login" ? "signup" : "login"))
            }
          >
            {mode === "login" ? copy.createAccount : copy.signIn}
          </button>
        </p>
      )}
    </>
  );
}
