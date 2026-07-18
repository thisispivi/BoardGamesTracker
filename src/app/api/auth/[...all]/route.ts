import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/server/auth";

/** Better Auth-compatible GET route. */
export const { GET, POST } = toNextJsHandler(auth);
