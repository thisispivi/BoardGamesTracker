import type { ReactNode } from "react";

/** Visible label and the form control it names. */
type LabeledFieldProps = {
  children: ReactNode;
  label: string;
};

/**
 * Wraps a form control in a label so the control gets its accessible name.
 *
 * @param root0 - Properties that configure one labelled field.
 * @param root0.children - The input, select or textarea being labelled.
 * @param root0.label - Localized label shown above the control.
 * @returns The labelled field.
 */
export function LabeledField({
  children,
  label,
}: LabeledFieldProps): ReactNode {
  return (
    <label className="block text-sm font-bold">
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}
