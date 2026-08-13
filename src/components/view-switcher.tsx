import { LayoutGrid, MapIcon, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  onChange,
}: {
  value: HomeView;
  onChange: (view: HomeView) => void;
}) {
  return (
    <div className="flex h-9 items-center gap-1 rounded-lg border border-border bg-card p-1 shadow-xs">
      {views.map((view) => {
        const Icon = view.icon;
        return (
          <Button
            key={view.id}
            type="button"
            size="icon-sm"
            variant={value === view.id ? "secondary" : "ghost"}
            className={
              value === view.id
                ? "rounded-md bg-data-accent text-white shadow-sm hover:bg-data-accent/85"
                : "rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            }
            aria-label={t(view.label)}
            title={t(view.label)}
            onClick={() => onChange(view.id)}
          >
            <Icon />
          </Button>
        );
      })}
    </div>
  );
}
