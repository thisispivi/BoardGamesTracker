import { count, desc, eq } from "drizzle-orm";
import { Activity, BookOpen, Shield, Users } from "lucide-react";
import type { Metadata } from "next";

import { AdminUserActions } from "@/components/admin-user-actions";
import { PageHeader } from "@/components/page-header";
import { getDictionary, getLocale } from "@/lib/i18n";
import { translate } from "@/lib/messages";
import { db } from "@/server/db";
import { auditLogs, collectionItems, user } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";

/** Administrator page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary();
  return { title: translate(dictionary, "admin.metaTitle") };
}

/** User management, service health, collection, and audit console. */
export default async function AdminPage() {
  const [actor, dictionary, locale] = await Promise.all([
    requireAdmin(),
    getDictionary(),
    getLocale(),
  ]);
  const [usersList, userCount, gameCount, recentLogs] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        banned: user.banned,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))
      .limit(100),
    db.select({ value: count() }).from(user),
    db.select({ value: count() }).from(collectionItems),
    db
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        targetType: auditLogs.targetType,
        targetId: auditLogs.targetId,
        createdAt: auditLogs.createdAt,
        actorName: user.name,
      })
      .from(auditLogs)
      .leftJoin(user, eq(auditLogs.actorId, user.id))
      .orderBy(desc(auditLogs.createdAt))
      .limit(25),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={translate(dictionary, "admin.eyebrow")}
        title={translate(dictionary, "admin.title")}
        description={translate(dictionary, "admin.description")}
      />
      <section className="mb-7 grid gap-3 sm:grid-cols-3">
        {[
          {
            label: translate(dictionary, "admin.users"),
            value: userCount[0]?.value ?? 0,
            icon: Users,
          },
          {
            label: translate(dictionary, "admin.items"),
            value: gameCount[0]?.value ?? 0,
            icon: BookOpen,
          },
          {
            label: translate(dictionary, "admin.service"),
            value: translate(dictionary, "admin.healthy"),
            icon: Activity,
          },
        ].map((stat) => (
          <article
            key={stat.label}
            className="bg-card shadow-soft rounded-xl border p-5"
          >
            <stat.icon className="text-primary mb-5 size-5" />
            <p className="font-display text-2xl font-bold">{stat.value}</p>
            <p className="text-muted-foreground mt-1 text-xs">{stat.label}</p>
          </article>
        ))}
      </section>

      <section className="bg-card shadow-soft mb-7 overflow-hidden rounded-3xl border">
        <div className="flex items-center gap-3 border-b p-6">
          <Shield className="text-primary size-5" />
          <div>
            <h2 className="font-display text-xl font-bold">
              {translate(dictionary, "admin.access")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {translate(dictionary, "admin.accessBody")}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs tracking-wide uppercase">
              <tr>
                <th className="px-6 py-3">
                  {translate(dictionary, "admin.user")}
                </th>
                <th className="px-6 py-3">
                  {translate(dictionary, "admin.role")}
                </th>
                <th className="px-6 py-3">
                  {translate(dictionary, "admin.status")}
                </th>
                <th className="px-6 py-3">
                  {translate(dictionary, "admin.joined")}
                </th>
                <th className="px-6 py-3 text-right">
                  {translate(dictionary, "admin.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {usersList.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4">
                    <p className="font-bold">{record.name}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {record.email}
                    </p>
                  </td>
                  <td className="px-6 py-4 capitalize">{record.role}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${record.banned ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}
                    >
                      {translate(
                        dictionary,
                        record.banned ? "admin.banned" : "admin.active",
                      )}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-6 py-4">
                    {record.createdAt.toLocaleDateString(locale)}
                  </td>
                  <td className="px-6 py-4">
                    <AdminUserActions
                      user={record}
                      isSelf={record.id === actor.user.id}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card shadow-soft rounded-3xl border p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-primary text-xs font-bold tracking-widest uppercase">
            {translate(dictionary, "admin.trail")}
          </p>
          <h2 className="font-display mt-1 text-xl font-bold">
            {translate(dictionary, "admin.recent")}
          </h2>
        </div>
        <div className="space-y-1">
          {recentLogs.map((event) => (
            <div
              key={event.id}
              className="hover:bg-muted/60 grid gap-1 rounded-xl px-3 py-3 text-sm sm:grid-cols-[1fr_180px] sm:items-center"
            >
              <div>
                <strong>{event.action}</strong>
                <span className="text-muted-foreground ml-2 text-xs">
                  {event.actorName ?? translate(dictionary, "admin.system")} ·{" "}
                  {event.targetType}
                </span>
              </div>
              <time className="text-muted-foreground text-xs sm:text-right">
                {event.createdAt.toLocaleString(locale)}
              </time>
            </div>
          ))}
          {recentLogs.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">
              {translate(dictionary, "admin.noEvents")}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
