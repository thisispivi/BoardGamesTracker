/** One serialized administrator audit-log event. */
export type AuditLogEvent = {
  action: string;
  actorName: string | null;
  createdAt: string;
  id: string;
  targetType: string;
};

/** One bounded page of administrator audit-log events. */
export type AuditLogPage = {
  events: AuditLogEvent[];
  page: number;
  pages: number;
};
