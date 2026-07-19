import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
};

/**
 * Consistent title, eyebrow, description, and action region.
 *
 * @param root0 - Component or function properties.
 * @param root0.eyebrow - The 'eyebrow' property.
 * @param root0.title - The 'title' property.
 * @param root0.description - The 'description' property.
 * @param root0.action - The 'action' property.
 * @returns The documented function result.
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
        <p className="text-primary mb-2 text-xs font-bold tracking-[0.18em] uppercase">
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
