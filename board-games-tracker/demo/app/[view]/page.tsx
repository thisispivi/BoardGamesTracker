import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { DemoShowcase } from "@/components/templates/DemoShowcase/DemoShowcase";
import { demoViews } from "@/core";
import { createDemoLibrary } from "@/utils/demoLibrary";

/** Excludes paths outside the finite, server-free showcase. */
export const dynamicParams = false;

/**
 * Enumerates every page emitted by the static demo build.
 *
 * @returns The complete set of publicly browsable example pages.
 */
export function generateStaticParams(): { view: string }[] {
  return demoViews.map((view) => ({ view }));
}

/**
 * Renders one of the fictional account's statically exported product pages.
 *
 * @param root0 - The build-time route parameters.
 * @param root0.params - The requested showcase page name.
 * @returns The selected page, or the static not-found response for an unknown name.
 */
export default async function DemoPage({
  params,
}: {
  params: Promise<{ view: string }>;
}): Promise<ReactNode> {
  const { view } = await params;
  const selected = demoViews.find((candidate) => candidate === view);
  if (!selected) notFound();
  const basePath = process.env.NEXT_PUBLIC_DEMO_BASE_PATH ?? "";
  return (
    <DemoShowcase
      basePath={basePath}
      library={createDemoLibrary(basePath)}
      view={selected}
    />
  );
}
