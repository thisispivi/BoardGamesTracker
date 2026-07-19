import { z } from "zod";

/** Validates a bounded account identifier. */
export const userIdSchema = z.string().min(1).max(128);

/** Validates an audit-log page number. */
export const auditPageSchema = z.number().int().positive().max(1_000_000);

/** Validates an application role. */
export const roleSchema = z.enum(["user", "admin"]);

/** Validates serialized ban-state form values. */
export const bannedSchema = z.enum(["true", "false"]);
