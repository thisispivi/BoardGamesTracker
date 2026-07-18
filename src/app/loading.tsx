import { AppSpinner } from "@/components/ui/app-spinner";

/** Global streaming fallback for the first application load. */
export default function Loading() {
  return (
    <div className="bg-background grid min-h-screen place-items-center">
      <AppSpinner className="size-11" label="Loading" />
    </div>
  );
}
