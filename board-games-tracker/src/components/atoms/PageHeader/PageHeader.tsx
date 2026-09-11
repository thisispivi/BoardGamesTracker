import type { ReactNode } from "react";

/** Properties displayed by a page-level heading. */
type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

/**
 * Consistent title, eyebrow, description, and action region.
 *
 * @param root0 - Properties that configure page header.
 * @param root0.eyebrow - Optional context displayed above the page title.
 * @param root0.title - Localized heading displayed by the component.
 * @param root0.description - Localized explanatory text shown to the user.
 * @param root0.action - Server action invoked by the form.
 * @returns The rendered page header.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: PageHeaderProps): ReactNode {
  return (
    <header className="mb-8 flex flex-col gap-5 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl">
        <p className="text-accent mb-2 text-xs font-bold tracking-[0.18em] uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="text-muted-foreground mt-3">{description}</p>
      </div>
      {action}
    </header>
  );
}
