import { count, desc } from "drizzle-orm";
import { Activity, BookOpen, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";

import { AdminUserActions } from "@/components/admin-user-actions";
import { AuditLogPanel } from "@/components/audit-log-panel";
import { PageHeader } from "@/components/page-header";
import { getAuditLogPage } from "@/server/admin/audit-logs";
import { db } from "@/server/db";
import { collectionItems, user } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";

/** Administrator page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("admin.metaTitle") };
}

/** User management, service health, collection, and audit console. */
export default async function AdminPage() {
  const [actor, t, format] = await Promise.all([
    requireAdmin(),
    getTranslations(),
    getFormatter(),
  ]);
  const [usersList, userCount, gameCount, initialAuditPage] = await Promise.all(
    [
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
      getAuditLogPage(1),
    ],
  );

  return (
    <>
      <PageHeader
        description={t("admin.description")}
        eyebrow={t("admin.eyebrow")}
        title={t("admin.title")}
      />
      <section className="mb-7 grid gap-3 sm:grid-cols-3">
        {[
          {
            label: t("admin.users"),
            value: userCount[0]?.value ?? 0,
            icon: Users,
          },
          {
            label: t("admin.items"),
            value: gameCount[0]?.value ?? 0,
            icon: BookOpen,
          },
          {
            label: t("admin.service"),
            value: t("admin.healthy"),
            icon: Activity,
          },
        ].map((stat) => (
          <article
            className="bg-card shadow-soft rounded-xl border p-5"
            key={stat.label}
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
              {t("admin.access")}
            </h2>
            <p className="text-muted-foreground text-sm">
              {t("admin.accessBody")}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs tracking-wide uppercase">
              <tr>
                <th className="px-6 py-3">{t("admin.user")}</th>
                <th className="px-6 py-3">{t("admin.role")}</th>
                <th className="px-6 py-3">{t("admin.status")}</th>
                <th className="px-6 py-3">{t("admin.joined")}</th>
                <th className="px-6 py-3 text-right">{t("admin.actions")}</th>
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
                      {record.banned ? t("admin.banned") : t("admin.active")}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-6 py-4">
                    {format.dateTime(record.createdAt, {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <AdminUserActions
                      isSelf={record.id === actor.user.id}
                      user={record}
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
            {t("admin.trail")}
          </p>
          <h2 className="font-display mt-1 text-xl font-bold">
            {t("admin.recent")}
          </h2>
        </div>
        <AuditLogPanel initialPage={initialAuditPage} />
      </section>
    </>
  );
}
