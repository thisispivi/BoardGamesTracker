import { Banknote, UserRound } from "lucide-react";
import type { Metadata } from "next";

import { ClearCollectionCard } from "@/components/clear-collection-card";
import { CurrencySelect } from "@/components/currency-select";
import { PageHeader } from "@/components/page-header";
import { UserDataCard } from "@/components/user-data-card";
import { getDictionary } from "@/lib/i18n";
import { translate } from "@/lib/messages";
import { requireUser } from "@/server/session";
import { getUserPreferences } from "@/server/preferences";

/** Settings page metadata. */
export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary();
  return { title: translate(dictionary, "settings.metaTitle") };
}

/** Account and session settings for the signed-in user. */
export default async function SettingsPage() {
  const session = await requireUser();
  const [preferences, dictionary] = await Promise.all([
    getUserPreferences(session.user.id),
    getDictionary(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow={translate(dictionary, "settings.eyebrow")}
        title={translate(dictionary, "settings.title")}
        description={translate(dictionary, "settings.description")}
      />
      <div className="max-w-3xl space-y-6">
        <section className="bg-card shadow-soft rounded-3xl border p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-2xl">
              <UserRound className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold">
                {translate(dictionary, "settings.account")}
              </h2>
              <p className="text-muted-foreground text-sm">
                {translate(dictionary, "settings.accountBody")}
              </p>
            </div>
          </div>
          <dl className="mt-8 divide-y rounded-xl border px-5">
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-muted-foreground text-sm">
                {translate(dictionary, "settings.name")}
              </dt>
              <dd className="text-sm font-bold">{session.user.name}</dd>
            </div>
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-muted-foreground text-sm">
                {translate(dictionary, "settings.email")}
              </dt>
              <dd className="truncate text-sm font-bold">
                {session.user.email}
              </dd>
            </div>
            <div className="flex justify-between gap-4 py-4">
              <dt className="text-muted-foreground text-sm">
                {translate(dictionary, "settings.role")}
              </dt>
              <dd className="bg-muted rounded-full px-3 py-1 text-xs font-bold capitalize">
                {session.user.role}
              </dd>
            </div>
          </dl>
          <p className="text-muted-foreground mt-5 text-xs leading-5">
            {translate(dictionary, "settings.session")}
          </p>
        </section>
        <section className="bg-card shadow-soft rounded-3xl border p-6 sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-2xl">
                <Banknote className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold">
                  {translate(dictionary, "settings.currency")}
                </h2>
                <p className="text-muted-foreground text-sm">
                  {translate(dictionary, "settings.currencyBody")}
                </p>
              </div>
            </div>
            <CurrencySelect initialCurrency={preferences.currency} />
          </div>
        </section>
        <UserDataCard />
        <ClearCollectionCard />
      </div>
    </>
  );
}
