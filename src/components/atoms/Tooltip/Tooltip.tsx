"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

type TooltipProps = {
  children: React.ReactElement;
  content: React.ReactNode;
};

/** Accessible themed tooltip with consistent timing, spacing, and animation. */
export function Tooltip({ children, content }: TooltipProps): ReactNode {
  return (
    <TooltipPrimitive.Provider delayDuration={250} skipDelayDuration={100}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="popover-content bg-card text-card-foreground z-100 max-w-72 rounded-xl border px-3.5 py-2.5 text-xs leading-5 shadow-2xl"
            collisionPadding={12}
            side="top"
            sideOffset={8}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-card" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
