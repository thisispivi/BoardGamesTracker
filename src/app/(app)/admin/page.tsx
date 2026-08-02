import { count, desc } from "drizzle-orm";
import { Activity, BookOpen, Shield, Users } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";

import { PageHeader } from "@/components/atoms/PageHeader/PageHeader";
import { AdminGamesPanel } from "@/components/organisms/AdminGamesPanel/AdminGamesPanel";
import { AdminUserActions } from "@/components/organisms/AdminUserActions/AdminUserActions";
import { AuditLogPanel } from "@/components/organisms/AuditLogPanel/AuditLogPanel";
import { getAuditLogPage } from "@/server/admin/auditLogs";
import { getAdminGamesPage } from "@/server/admin/games";
import { db } from "@/server/db";
import { collectionItems, user } from "@/server/db/schema";
import { requireAdmin } from "@/server/session";

/**
 * Administrator page metadata.
 *
 * @returns The documented function result.
 */
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("admin.metaTitle") };
}

/**
 * User management, service health, collection, and audit console.
 *
 * @returns The documented function result.
 */
export default async function AdminPage() {
  const [actor, t, format] = await Promise.all([
    requireAdmin(),
    getTranslations(),
    getFormatter(),
  ]);
  const [usersList, userCount, gameCount, initialAuditPage, initialGamesPage] =
    await Promise.all([
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
      getAdminGamesPage(1, ""),
    ]);

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
        <div className="divide-y md:hidden">
          {usersList.map((record) => (
            <div className="p-4" key={record.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold">{record.name}</p>
                  <p className="text-muted-foreground mt-1 truncate text-xs">
                    {record.email}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${record.banned ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"}`}
                >
                  {record.banned ? t("admin.banned") : t("admin.active")}
                </span>
              </div>
              <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="capitalize">{record.role}</span>
                <span>
                  {format.dateTime(record.createdAt, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="mt-3 flex justify-end">
                <AdminUserActions
                  isSelf={record.id === actor.user.id}
                  user={record}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
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

      <section className="bg-card shadow-soft mb-6 rounded-3xl border p-6 sm:p-8">
        <div className="mb-6">
          <p className="text-primary text-xs font-bold tracking-widest uppercase">
            {t("adminGames.eyebrow")}
          </p>
          <h2 className="font-display mt-1 text-xl font-bold">
            {t("adminGames.title")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            {t("adminGames.body")}
          </p>
        </div>
        <AdminGamesPanel initialPage={initialGamesPage} />
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
