/** Global streaming fallback with a low-motion skeleton. */
export default function Loading() {
  return (
    <div className="bg-background grid min-h-screen place-items-center">
      <div className="text-center">
        <span className="bg-primary mx-auto block size-12 animate-pulse rounded-2xl" />
        <p className="text-muted-foreground mt-4 text-sm font-semibold">
          Loading…
        </p>
      </div>
    </div>
  );
}
