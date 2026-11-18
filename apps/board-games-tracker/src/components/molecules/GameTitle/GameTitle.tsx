"use client";

import { type ReactNode, useCallback, useState } from "react";

import { Tooltip } from "@/components/atoms/Tooltip/Tooltip";
import { cn } from "@/utils/cn";

/** Game name, its typography, and the element that carries it. */
type GameTitleProps = {
  as?: "h2" | "p";
  className?: string;
  name: string;
};

/**
 * Shows a game name on one line, revealing the whole of it when it is clipped.
 *
 * Every card then reserves the same height for its title, whatever the length
 * of the name. Clipping is a layout decision only: the element always holds the
 * complete name, so assistive technology reads it whether or not it fits.
 *
 * @param root0 - Properties that configure the title.
 * @param root0.as - Element to render, so a secondary name is not a heading.
 * @param root0.className - Optional classes merged with the element styles.
 * @param root0.name - Game name displayed by the element.
 * @returns The name, wrapped in a tooltip only while it is clipped.
 */
export function GameTitle({
  as: Element = "h2",
  className,
  name,
}: GameTitleProps): ReactNode {
  const [clipped, setClipped] = useState(false);

  const measureName = useCallback((element: HTMLElement | null) => {
    if (!element) return;
    const observer = new ResizeObserver(() =>
      setClipped(element.scrollWidth > element.clientWidth),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const title = (
    <Element className={cn("min-w-0 truncate", className)} ref={measureName}>
      {name}
    </Element>
  );

  return clipped ? <Tooltip content={name}>{title}</Tooltip> : title;
}
