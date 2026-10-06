/** One option rendered by the shared select control. */
export type SelectOption<Label = string> = {
  label: Label;
  value: string;
};

/** One searchable facet and its optional occurrence count. */
export type MultiSelectOption = {
  count?: number;
  label: string;
  value: string;
};

/** One taxonomy label and the facet it was drawn from. */
export type GameTag = {
  label: string;
  tone: "category" | "mechanic";
};
