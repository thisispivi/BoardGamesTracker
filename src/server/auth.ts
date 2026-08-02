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

import { env } from "@/env";
import { isBootstrapRequired } from "@/server/bootstrap";
import { db } from "@/server/db";
import * as schema from "@/server/db/schema";
import { isCurrentlyBanned } from "@/server/security/ban";

const bannedUserMessage = "This account has been suspended.";

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
    // Registration is gated dynamically so an empty installation can bootstrap.
    disableSignUp: false,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    autoSignIn: true,
    revokeSessionsOnPasswordReset: true,
  },
  user: {
    changeEmail: {
      enabled: true,
      // This self-hosted installation has no transactional email provider.
      updateEmailWithoutVerification: true,
    },
    deleteUser: { enabled: true },
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
      "/forget-password": { window: 300, max: 3 },
    },
  },
  advanced: {
    cookiePrefix: "board_games_tracker",
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  },
  hooks: {
    /**
     * Refuses every authenticated Better Auth endpoint to a suspended account.
     *
     * The admin plugin only blocks session creation, so without this a session
     * issued before the ban could still drive `/api/auth/*` directly, which
     * never passes through the application's own `getSession`.
     */
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
