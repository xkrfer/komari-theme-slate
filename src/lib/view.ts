import type { HomeView } from "@/lib/schemas";

export const VIEW_STORAGE_KEY = "slate:view";
const MOBILE_QUERY = "(max-width: 767px)";

export function isMobileViewport(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

export function readStoredView(): HomeView | null {
  const stored = localStorage.getItem(VIEW_STORAGE_KEY);
  if (stored === "table" || stored === "cards" || stored === "map") {
    return stored;
  }
  return null;
}

export function writeStoredView(view: HomeView): void {
  localStorage.setItem(VIEW_STORAGE_KEY, view);
}

export function resolveHomeView(
  managedDefault: HomeView,
  enableMap = true,
): HomeView {
  const stored = readStoredView();
  if (stored && (stored !== "map" || enableMap)) {
    return stored;
  }
  if (isMobileViewport()) {
    return "cards";
  }
  return managedDefault === "map" && !enableMap ? "table" : managedDefault;
}
