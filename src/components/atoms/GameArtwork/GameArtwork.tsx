import Image from "next/image";

import { cn } from "@/utils/cn";

/** Responsive game-box artwork with a polished text fallback. */
export function GameArtwork({
  eager = false,
  name,
  imageUrl,
  className,
  imageClassName,
}: {
  eager?: boolean;
  name: string;
  imageUrl: string | null;
  className?: string;
  imageClassName?: string;
}) {
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
