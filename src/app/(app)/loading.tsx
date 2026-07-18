import { AppSpinner } from "@/components/ui/app-spinner";

/** Immediate fallback for navigation between authenticated pages. */
export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <AppSpinner className="size-10" label="Loading" />
    </div>
  );
}
