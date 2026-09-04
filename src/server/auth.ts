import "server-only";

import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
  APIError,
  createAuthMiddleware,
  getSessionFromCtx,
} from "better-auth/api";
import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { after } from "next/server";

import { env } from "@/env";
import { isBootstrapRequired } from "@/server/bootstrap";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import { sendAuthActionMail } from "@/server/mail/authMail";
import { isMailConfigured } from "@/server/mail/config";
import { isCurrentlyBanned } from "@/server/security/ban";

const bannedUserMessage = "This account has been suspended.";
const mailEnabled = isMailConfigured();

/** Better Auth server with hardened email/password sessions and RBAC. */
export const auth = betterAuth({
  appName: "Board Games Tracker",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    autoSignIn: !mailEnabled,
    revokeSessionsOnPasswordReset: true,
    requireEmailVerification: mailEnabled,
    ...(mailEnabled
      ? {
          resetPasswordTokenExpiresIn: 60 * 60,
          sendResetPassword: async (
            {
              user,
              url,
            }: { user: { email: string; name: string }; url: string },
            request?: Request,
          ) =>
            sendAuthActionMail({
              kind: "passwordReset",
              name: user.name,
              recipient: user.email,
              url,
              ...(request === undefined ? {} : { request }),
            }),
        }
      : {}),
  },
  ...(mailEnabled
    ? {
        emailVerification: {
          autoSignInAfterVerification: true,
          expiresIn: 60 * 60,
          sendOnSignIn: true,
          sendOnSignUp: true,
          sendVerificationEmail: async (
            {
              user,
              url,
            }: { user: { email: string; name: string }; url: string },
            request?: Request,
          ) =>
            sendAuthActionMail({
              kind: "verification",
              name: user.name,
              recipient: user.email,
              url,
              ...(request === undefined ? {} : { request }),
            }),
        },
      }
    : {}),
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: !mailEnabled,
      ...(mailEnabled
        ? {
            sendChangeEmailConfirmation: async (
              {
                user,
                newEmail,
                url,
              }: {
                user: { email: string; name: string };
                newEmail: string;
                url: string;
              },
              request?: Request,
            ) =>
              sendAuthActionMail({
                kind: "emailChange",
                name: user.name,
                newEmail,
                recipient: user.email,
                url,
                ...(request === undefined ? {} : { request }),
              }),
          }
        : {}),
    },
    deleteUser: {
      enabled: true,
      ...(mailEnabled
        ? {
            deleteTokenExpiresIn: 60 * 60 * 24,
            sendDeleteAccountVerification: async (
              {
                user,
                url,
              }: { user: { email: string; name: string }; url: string },
              request?: Request,
            ) =>
              sendAuthActionMail({
                kind: "accountDeletion",
                name: user.name,
                recipient: user.email,
                url,
                ...(request === undefined ? {} : { request }),
              }),
          }
        : {}),
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 14,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: false,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 8 },
      "/sign-up/email": { window: 300, max: 5 },
      "/request-password-reset": { window: 300, max: 3 },
      "/send-verification-email": { window: 300, max: 3 },
      "/change-email": { window: 300, max: 3 },
      "/delete-user": { window: 300, max: 3 },
    },
  },
  advanced: {
    backgroundTasks: {
      handler: (promise) => after(() => promise),
    },
    cookiePrefix: "board_games_tracker",
    useSecureCookies: env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      const active = await getSessionFromCtx(ctx, {
        disableCookieCache: true,
      }).catch(() => null);
      if (!active?.user || !isCurrentlyBanned(active.user)) {
        return;
      }

      await db
        .delete(schema.session)
        .where(eq(schema.session.userId, active.user.id));
      throw APIError.from("FORBIDDEN", {
        code: "BANNED_USER",
        message: bannedUserMessage,
      });
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (newUser) => {
          const bootstrapRequired = await isBootstrapRequired();
          if (!bootstrapRequired && !env.ALLOW_SIGN_UP) {
            throw APIError.from("FORBIDDEN", {
              code: "SIGN_UP_DISABLED",
              message: "Registration is closed.",
            });
          }

          const matchesConfiguredAdmin =
            env.ADMIN_EMAIL &&
            newUser.email.toLowerCase() === env.ADMIN_EMAIL.toLowerCase();

          return {
            data: {
              ...newUser,
              role:
                bootstrapRequired || matchesConfiguredAdmin ? "admin" : "user",
            },
          };
        },
      },
    },
    session: {
      create: {
        after: async (newSession) => {
          await db.insert(schema.auditLogs).values({
            actorId: newSession.userId,
            action: "auth.session_created",
            targetType: "session",
            targetId: newSession.id,
            ipAddress: newSession.ipAddress,
            metadata: {},
          });
        },
      },
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
      bannedUserMessage,
    }),
    nextCookies(),
  ],
});
