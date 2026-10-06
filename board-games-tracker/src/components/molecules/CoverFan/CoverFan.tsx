"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { GameArtwork } from "@/components/atoms/GameArtwork/GameArtwork";
import type { CollectionGame } from "@/core";
import { cn } from "@/utils/cn";

/**
 * Resting placement of each cover, front cover first.
 *
 * Horizontal offsets are a share of the cover width and vertical offsets are
 * pixels, so the fan keeps its shape at every cover size.
 */
const fanSlots = [
  { rotate: 0, scale: 1, x: 0, y: 0 },
  { rotate: -7, scale: 0.88, x: -42, y: 14 },
  { rotate: 7, scale: 0.88, x: 42, y: 14 },
  { rotate: -14, scale: 0.76, x: -78, y: 34 },
  { rotate: 14, scale: 0.76, x: 78, y: 34 },
] as const;

/** Games whose covers are fanned out, with the list's accessible name. */
type CoverFanProps = {
  className?: string;
  games: CollectionGame[];
  label: string;
};

/**
 * Fans up to five box covers out from a single stack.
 *
 * The covers spring from the stack into place once, drawing the eye to the
 * shelf before the rest of the page; with reduced motion they start at rest.
 *
 * @param root0 - Properties that configure the cover fan.
 * @param root0.className - Classes merged with the fan container, typically spacing.
 * @param root0.games - Games in display priority, front cover first; extras beyond five are ignored.
 * @param root0.label - Accessible name of the cover list.
 * @returns An overlapping list of covers.
 */
export function CoverFan({
  className,
  games,
  label,
}: CoverFanProps): ReactNode {
  const reduceMotion = useReducedMotion();

  return (
    <ul
      aria-label={label}
      className={cn("relative mx-auto h-56 w-full max-w-md sm:h-72", className)}
    >
      {games.slice(0, fanSlots.length).map((game, index) => {
        const slot = fanSlots[index] ?? fanSlots[0];
        return (
          <motion.li
            animate={{
              opacity: 1,
              rotate: slot.rotate,
              scale: slot.scale,
              x: `${slot.x}%`,
              y: slot.y,
            }}
            className="absolute top-1/2 left-1/2 w-32 -translate-x-1/2 -translate-y-1/2 sm:w-40"
            initial={
              reduceMotion
                ? false
                : { opacity: 0, rotate: 0, scale: 0.9, x: "0%", y: 24 }
            }
            key={game.id}
            style={{ zIndex: fanSlots.length - index }}
            transition={{
              damping: 20,
              delay: index * 0.07,
              stiffness: 140,
              type: "spring",
            }}
          >
            <GameArtwork
              className="ring-card shadow-xl ring-4"
              eager={index === 0}
              imageUrl={game.imageUrl}
              name={game.name}
            />
          </motion.li>
        );
      })}
    </ul>
  );
}
