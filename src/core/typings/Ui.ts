import type { ReactNode } from "react";

/** One option rendered by the shared select control. */
export type SelectOption = {
  label: ReactNode;
  value: string;
};

/** One searchable facet and its optional occurrence count. */
export type MultiSelectOption = {
  count?: number;
  label: string;
  value: string;
};
