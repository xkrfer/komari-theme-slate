import { createFileRoute, Link } from "@tanstack/react-router";
import { InstanceDetail } from "@/components/instance-detail";
import { useNodes } from "@/hooks/use-komari";
import { t } from "@/lib/i18n";

const DETAIL_SKELETON_GROUPS = ["overview", "hardware", "liveMetrics"] as const;
const CHART_SKELETON_ITEMS = Array.from(
  { length: 6 },
  (_, index) => `chart-${index + 1}`,
);

export const Route = createFileRoute("/instance/$uuid")({
  component: InstancePage,
});

function InstancePage() {
  const { uuid } = Route.useParams();
  const nodes = useNodes();
  const client = nodes.data?.find((item) => item.uuid === uuid);

  if (nodes.isLoading) {
    return (
      <main className="km-page-instance mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <div className="flex items-center gap-3">
          <div className="km-skeleton size-8 rounded-full" />
          <div className="km-skeleton h-7 w-44 rounded-md" />
        </div>
        <div className="mt-7 grid items-stretch gap-3 lg:grid-cols-3">
          {DETAIL_SKELETON_GROUPS.map((key) => (
            <div
              key={key}
              className="min-h-52 overflow-hidden rounded-lg bg-card shadow-xs ring-1 ring-border"
            >
              <div className="border-b px-4 py-3 text-xs font-medium text-muted-foreground">
                {t(key)}
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-5 p-4">
                <div className="space-y-2">
                  <div className="km-skeleton h-3 w-12 rounded-sm" />
                  <div className="km-skeleton h-5 w-20 rounded-sm" />
                </div>
                <div className="space-y-2">
                  <div className="km-skeleton h-3 w-14 rounded-sm" />
                  <div className="km-skeleton h-5 w-16 rounded-sm" />
                </div>
                <div className="col-span-2 space-y-2">
                  <div className="km-skeleton h-3 w-16 rounded-sm" />
                  <div className="km-skeleton h-5 w-3/5 rounded-sm" />
                </div>
                <div className="col-span-2 space-y-2">
                  <div className="km-skeleton h-3 w-20 rounded-sm" />
                  <div className="km-skeleton h-5 w-4/5 rounded-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {CHART_SKELETON_ITEMS.map((item) => (
            <div
              key={item}
              className="rounded-lg bg-card p-5 ring-1 ring-border"
            >
              <div className="km-skeleton h-5 w-20 rounded-sm" />
              <div className="km-skeleton mt-8 h-44 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (!client) {
    return (
      <main className="km-page-instance mx-auto max-w-6xl flex-1 px-4 py-6">
        <p className="text-sm text-destructive">{t("notFound")}</p>
        <Link
          to="/"
          className="mt-3 inline-block text-sm text-data-accent hover:underline"
        >
          {t("back")}
        </Link>
      </main>
    );
  }

  return <InstanceDetail client={client} />;
}
