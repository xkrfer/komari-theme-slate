import { LayoutGrid, MapIcon, Table2 } from "lucide-react";
import { t } from "@/lib/i18n";
import type { HomeView } from "@/lib/schemas";

const views: {
  id: HomeView;
  icon: typeof Table2;
  label: "viewTable" | "viewCards" | "viewMap";
}[] = [
  { id: "table", icon: Table2, label: "viewTable" },
  { id: "cards", icon: LayoutGrid, label: "viewCards" },
  { id: "map", icon: MapIcon, label: "viewMap" },
];

export function ViewSwitcher({
  value,
  showMap = true,
  onMapIntent,
  onChange,
}: {
  value: HomeView;
  showMap?: boolean;
  onMapIntent?: () => void;
  onChange: (view: HomeView) => void;
}) {
  return (
    <div className="flex h-9 items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-xs">
      {views
        .filter((view) => showMap || view.id !== "map")
        .map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              type="button"
              className={`inline-flex size-7 items-center justify-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 [&_svg]:size-4 ${
                value === view.id
                  ? "rounded-md bg-data-accent text-white shadow-sm hover:bg-data-accent/85"
                  : "rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              aria-label={t(view.label)}
              title={t(view.label)}
              onPointerEnter={view.id === "map" ? onMapIntent : undefined}
              onFocus={view.id === "map" ? onMapIntent : undefined}
              onClick={() => onChange(view.id)}
            >
              <Icon />
            </button>
          );
        })}
    </div>
  );
}
