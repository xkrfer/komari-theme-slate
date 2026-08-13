function Skeleton({ className }: { className: string }) {
  return <div className={`km-skeleton rounded-md ${className}`} />;
}

const STAT_SKELETONS = ["total", "online", "offline", "network"];
const ROW_SKELETONS = ["row-a", "row-b", "row-c", "row-d", "row-e"];

export function HomeLoading() {
  return (
    <>
      <div
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        aria-hidden="true"
      >
        {STAT_SKELETONS.map((id) => (
          <div
            key={id}
            className="h-28 rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-3 h-7 w-14" />
              </div>
              <Skeleton className="size-8" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10" aria-hidden="true">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Skeleton className="h-4 w-16" />
            <Skeleton className="mt-2 h-3 w-44" />
          </div>
          <Skeleton className="h-9 w-44" />
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <Skeleton className="h-10 w-full rounded-none" />
          {ROW_SKELETONS.map((id) => (
            <div
              key={id}
              className="grid h-15 grid-cols-8 items-center gap-4 border-t border-border px-4"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
