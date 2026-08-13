import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { t } from "@/lib/i18n";

export function NodeFilters({
  groups,
  group,
  onGroupChange,
}: {
  groups: string[];
  group: string | null;
  onGroupChange: (group: string | null) => void;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <>
      <Label className="sr-only" htmlFor="group-filter">
        {t("filterGroup")}
      </Label>
      <Select
        value={group ?? "all"}
        onValueChange={(value) => onGroupChange(value === "all" ? null : value)}
      >
        <SelectTrigger
          id="group-filter"
          className="h-9 min-w-28 bg-card text-xs font-medium shadow-xs data-[size=default]:h-9"
        >
          <SelectValue>
            {(value) => (value === "all" ? t("allGroups") : value)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value="all">{t("allGroups")}</SelectItem>
          {groups.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}
