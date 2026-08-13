import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";

export function GroupChips({
  groups,
  selected,
  onSelect,
}: {
  groups: string[];
  selected: string | null;
  onSelect: (group: string | null) => void;
}) {
  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <Button
        type="button"
        size="sm"
        className="rounded-sm px-3"
        variant={selected === null ? "default" : "outline"}
        onClick={() => onSelect(null)}
      >
        {t("allGroups")}
      </Button>
      {groups.map((group) => (
        <Button
          key={group}
          type="button"
          size="sm"
          className="rounded-sm px-3"
          variant={selected === group ? "default" : "outline"}
          onClick={() => onSelect(group)}
        >
          {group}
        </Button>
      ))}
    </div>
  );
}
