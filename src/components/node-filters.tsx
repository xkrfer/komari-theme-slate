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
    <label className="relative">
      <span className="sr-only">{t("filterGroup")}</span>
      <select
        id="group-filter"
        value={group ?? "all"}
        onChange={(event) =>
          onGroupChange(
            event.target.value === "all" ? null : event.target.value,
          )
        }
        className="h-9 min-w-28 appearance-none rounded-lg border border-input bg-card px-2.5 py-2 text-xs font-medium shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="all">{t("allGroups")}</option>
        {groups.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}
