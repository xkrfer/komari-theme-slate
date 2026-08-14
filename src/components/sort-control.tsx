import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";
import type { NodeSort, SortDirection } from "@/lib/schemas";

function getSortLabel(value: NodeSort) {
  if (value === "name") return t("sortName");
  if (value === "status") return t("sortStatus");
  if (value === "region") return t("colRegion");
  if (value === "uptime") return t("colUptime");
  if (value === "cpu") return t("cpu");
  if (value === "memory") return t("memory");
  if (value === "disk") return t("disk");
  return t("sortSpeed");
}

export function SortControl({
  value,
  direction,
  onChange,
  onDirectionChange,
}: {
  value: NodeSort;
  direction: SortDirection;
  onChange: (value: NodeSort) => void;
  onDirectionChange: (direction: SortDirection) => void;
}) {
  const DirectionIcon = direction === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="flex items-center gap-1.5">
      <Label className="sr-only" htmlFor="node-sort">
        {t("sort")}
      </Label>
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as NodeSort)}
      >
        <SelectTrigger
          id="node-sort"
          className="h-9 min-w-28 bg-card text-xs font-medium shadow-xs data-[size=default]:h-9"
        >
          <SelectValue>
            {(selectedValue) => getSortLabel(selectedValue as NodeSort)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="name">{t("sortName")}</SelectItem>
          <SelectItem value="status">{t("sortStatus")}</SelectItem>
          <SelectItem value="region">{t("colRegion")}</SelectItem>
          <SelectItem value="uptime">{t("colUptime")}</SelectItem>
          <SelectItem value="cpu">{t("cpu")}</SelectItem>
          <SelectItem value="memory">{t("memory")}</SelectItem>
          <SelectItem value="disk">{t("disk")}</SelectItem>
          <SelectItem value="speed">{t("sortSpeed")}</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="button"
        size="icon-sm"
        variant="outline"
        className="size-9 rounded-lg bg-card shadow-xs"
        aria-label={
          direction === "asc" ? t("sortAscending") : t("sortDescending")
        }
        title={direction === "asc" ? t("sortAscending") : t("sortDescending")}
        onClick={() => onDirectionChange(direction === "asc" ? "desc" : "asc")}
      >
        <DirectionIcon key={direction} className="km-sort-icon" />
      </Button>
    </div>
  );
}
