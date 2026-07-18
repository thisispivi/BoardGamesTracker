"use client";

import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Browser authentication client. */
export const authClient = createAuthClient({
  plugins: [adminClient()],
});
