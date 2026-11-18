import { type ReactNode, useId } from "react";

import { cn } from "@/utils/cn";

/**
 * Circular flag artwork, inlined so no outside host is contacted.
 *
 * Paths come from HatScripts/circle-flags (MIT), the set the language picker
 * previously loaded from react-circle-flags.pages.dev.
 */
const flagPaths = {
  gb: [
    {
      fill: "#eee",
      d: "m0 0 8 22-8 23v23l32 54-32 54v32l32 48-32 48v32l32 54-32 54v68l22-8 23 8h23l54-32 54 32h32l48-32 48 32h32l54-32 54 32h68l-8-22 8-23v-23l-32-54 32-54v-32l-32-48 32-48v-32l-32-54 32-54V0l-22 8-23-8h-23l-54 32-54-32h-32l-48 32-48-32h-32l-54 32L68 0H0z",
    },
    {
      fill: "#0052b4",
      d: "M336 0v108L444 0Zm176 68L404 176h108zM0 176h108L0 68ZM68 0l108 108V0Zm108 512V404L68 512ZM0 444l108-108H0Zm512-108H404l108 108Zm-68 176L336 404v108z",
    },
    {
      fill: "#d80027",
      d: "M0 0v45l131 131h45L0 0zm208 0v208H0v96h208v208h96V304h208v-96H304V0h-96zm259 0L336 131v45L512 0h-45zM176 336 0 512h45l131-131v-45zm160 0 176 176v-45L381 336h-45z",
    },
  ],
  it: [
    { fill: "#eee", d: "M167 0h178l25.9 252.3L345 512H167l-29.8-253.4z" },
    { fill: "#6da544", d: "M0 0h167v512H0z" },
    { fill: "#d80027", d: "M345 0h167v512H345z" },
  ],
} as const;

/** Country whose flag the picker shows next to a language. */
type FlagCountry = keyof typeof flagPaths;

/** Country to draw and optional sizing classes. */
type FlagProps = {
  className?: string;
  country: FlagCountry;
};

/**
 * Draws a decorative circular country flag.
 *
 * Each instance gets its own mask id, so several flags can share a page
 * without one clipping another.
 *
 * @param root0 - Flag selection and styling.
 * @param root0.className - Extra classes, typically the rendered size.
 * @param root0.country - ISO 3166 alpha-2 code of the flag to draw.
 * @returns An `aria-hidden` SVG flag.
 */
export function Flag({ className, country }: FlagProps): ReactNode {
  const maskId = useId();
  return (
    <svg
      aria-hidden="true"
      className={cn("shrink-0", className)}
      viewBox="0 0 512 512"
    >
      <mask id={maskId}>
        <circle cx="256" cy="256" fill="#fff" r="256" />
      </mask>
      <g mask={`url(#${maskId})`}>
        {flagPaths[country].map((path) => (
          <path d={path.d} fill={path.fill} key={path.fill} />
        ))}
      </g>
    </svg>
  );
}
