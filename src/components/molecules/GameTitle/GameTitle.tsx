"use client";

import { type ReactNode, useEffect, useRef, useState } from "react";

import { Tooltip } from "@/components/atoms/Tooltip/Tooltip";
import { cn } from "@/utils/cn";

/** Game name and the typography of the heading that carries it. */
type GameTitleProps = {
  className?: string;
  name: string;
};

/**
 * Shows a game name on one line, revealing the whole of it when it is clipped.
 *
 * Every card then reserves the same height for its title, whatever the length
 * of the name. Clipping is a layout decision only: the heading always holds the
 * complete name, so assistive technology reads it whether or not it fits.
 *
 * @param root0 - Properties that configure the title.
 * @param root0.className - Optional classes merged with the heading styles.
 * @param root0.name - Game name displayed by the heading.
 * @returns The heading, wrapped in a tooltip only while the name is clipped.
 */
export function GameTitle({ className, name }: GameTitleProps): ReactNode {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [clipped, setClipped] = useState(false);

  useEffect(() => {
    const heading = headingRef.current;
    if (!heading) return;
    const observer = new ResizeObserver(() =>
      setClipped(heading.scrollWidth > heading.clientWidth),
    );
    observer.observe(heading);
    return () => observer.disconnect();
  }, [name]);

  const heading = (
    <h2 className={cn("min-w-0 truncate", className)} ref={headingRef}>
      {name}
    </h2>
  );

  return clipped ? <Tooltip content={name}>{heading}</Tooltip> : heading;
}
