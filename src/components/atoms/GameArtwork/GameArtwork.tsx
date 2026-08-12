import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

/** Properties used to render safe game artwork and its fallback. */
type GameArtworkProps = {
  eager?: boolean;
  name: string;
  imageUrl: string | null;
  className?: string;
  imageClassName?: string;
};

/**
 * Responsive game-box artwork with a polished text fallback.
 *
 * @param root0 - Properties that configure game artwork.
 * @param root0.eager - Whether the artwork should load with high priority.
 * @param root0.name - Game name used for accessible artwork text.
 * @param root0.imageUrl - Validated artwork URL, when the game has one.
 * @param root0.className - Optional classes merged with the component styles.
 * @param root0.imageClassName - Optional classes applied to the image element.
 * @returns The rendered game artwork.
 */
export function GameArtwork({
  eager = false,
  name,
  imageUrl,
  className,
  imageClassName,
}: GameArtworkProps): ReactNode {
  if (imageUrl) {
    return (
      <div
        className={cn(
          "bg-muted relative aspect-square overflow-hidden rounded-xl shadow-sm",
          className,
        )}
      >
        <Image
          alt={`${name} box art`}
          className={cn("object-cover", imageClassName)}
          fill
          loading={eager ? "eager" : "lazy"}
          sizes="(max-width: 768px) 50vw, 20vw"
          src={imageUrl}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "from-primary text-primary-foreground relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-linear-to-br to-[#0d2923] p-5 text-center shadow-sm",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,white,transparent_35%)] opacity-25" />
      <span className="font-display relative text-lg font-bold">{name}</span>
    </div>
  );
}
