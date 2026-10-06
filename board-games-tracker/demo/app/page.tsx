import type { ReactNode } from "react";

import { DemoShowcase } from "@/components/templates/DemoShowcase/DemoShowcase";
import { createDemoLibrary } from "@/utils/demoLibrary";

/**
 * Opens the public showcase directly on the fictional user's dashboard.
 *
 * @returns The dashboard with bundled sample data and artwork.
 */
export default function DemoHome(): ReactNode {
  const basePath = process.env.NEXT_PUBLIC_DEMO_BASE_PATH ?? "";
  return (
    <DemoShowcase
      basePath={basePath}
      library={createDemoLibrary(basePath)}
      view="dashboard"
    />
  );
}
