import Link from "next/link";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/lib/i18n";
import { translate } from "@/lib/messages";

/** Friendly application-wide 404 response. */
export default async function NotFound() {
  const dictionary = await getDictionary();
  return (
    <main className="noise grid min-h-screen place-items-center p-6">
      <div className="max-w-lg text-center">
        <Logo className="mb-10 justify-center" />
        <p className="text-primary text-sm font-bold tracking-[0.2em] uppercase">
          {translate(dictionary, "notFound.eyebrow")}
        </p>
        <h1 className="font-display mt-4 text-5xl font-bold tracking-tight">
          {translate(dictionary, "notFound.title")}
        </h1>
        <p className="text-muted-foreground mt-5">
          {translate(dictionary, "notFound.body")}
        </p>
        <Link href="/" className={`${buttonVariants({ size: "lg" })} mt-8`}>
          {translate(dictionary, "notFound.home")}
        </Link>
      </div>
    </main>
  );
}
