import type { NodeSort, SortDirection } from "@/lib/schemas";

const SORT_STORAGE_KEY = "slate:sort";
const SORT_DIRECTION_STORAGE_KEY = "slate:sort-direction";

const NODE_SORTS: NodeSort[] = [
  "name",
  "status",
  "region",
  "uptime",
  "cpu",
  "memory",
  "disk",
  "speed",
];

export function readStoredSort(): NodeSort | null {
  const stored = localStorage.getItem(SORT_STORAGE_KEY);
  return NODE_SORTS.includes(stored as NodeSort) ? (stored as NodeSort) : null;
}

export function writeStoredSort(sort: NodeSort): void {
  localStorage.setItem(SORT_STORAGE_KEY, sort);
}

export function readStoredSortDirection(): SortDirection | null {
  const stored = localStorage.getItem(SORT_DIRECTION_STORAGE_KEY);
  return stored === "asc" || stored === "desc" ? stored : null;
}

export function writeStoredSortDirection(direction: SortDirection): void {
  localStorage.setItem(SORT_DIRECTION_STORAGE_KEY, direction);
}
