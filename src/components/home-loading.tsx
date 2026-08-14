function Skeleton({ className }: { className: string }) {
  return <div className={`km-skeleton rounded-md ${className}`} />;
}

const STAT_SKELETONS = ["total", "online", "offline", "network"];
const ROW_SKELETONS = ["row-a", "row-b", "row-c", "row-d", "row-e"];
const CARD_SKELETONS = [
  "card-a",
  "card-b",
  "card-c",
  "card-d",
  "card-e",
  "card-f",
  "card-g",
  "card-h",
  "card-i",
];

function TableLoading() {
  return (
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
  );
}

export function NodeContentLoading({
  view,
  rowCount,
}: {
  view: "table" | "cards";
  rowCount: number;
}) {
  if (view === "table") {
    return <TableLoading />;
  }

  const cardCount = Math.min(Math.max(rowCount, 3), 9);
  return (
    <div
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      aria-hidden="true"
    >
      {CARD_SKELETONS.slice(0, cardCount).map((id) => (
        <div
          key={id}
          className="h-96 rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Skeleton className="h-5 w-7" />
              <div>
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-2 h-3 w-14" />
              </div>
            </div>
            <Skeleton className="h-7 w-20" />
          </div>
          <Skeleton className="mt-5 h-5 w-36" />
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6">
            {ROW_SKELETONS.slice(0, 4).map((id) => (
              <div key={id}>
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-3 h-2 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-8 h-16 w-full" />
          <Skeleton className="mt-6 h-10 w-full" />
        </div>
      ))}
    </div>
  );
}

export function NodeMapLoading() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-card shadow-xs"
      aria-hidden="true"
    >
      <div className="border-b border-border/70 px-4 py-3.5">
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="bg-muted/15 px-2 py-3 sm:px-5 sm:py-4">
        <Skeleton className="h-80 w-full sm:h-105 lg:h-120" />
      </div>
    </div>
  );
}

export function HomeLoading({
  view = "table",
  rowCount = 9,
}: {
  view?: "table" | "cards" | "map";
  rowCount?: number;
}) {
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
        <div className="mb-4 flex min-h-11.5 items-end justify-between">
          <div className="flex h-11.5 flex-col justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-3 w-44" />
          </div>
          <Skeleton className="h-9 w-44" />
        </div>
        {view === "map" ? (
          <NodeMapLoading />
        ) : (
          <NodeContentLoading view={view} rowCount={rowCount} />
        )}
      </div>
    </>
  );
}
