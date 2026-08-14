import { t } from "@/lib/i18n";

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }
  const units = ["B", "KiB", "MiB", "GiB", "TiB", "PiB"];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = value >= 100 || unit === 0 ? 0 : 1;
  return `${value.toFixed(digits)} ${units[unit]}`;
}

export function formatSpeed(bytesPerSecond: number): string {
  return `${formatBytes(bytesPerSecond)}/s`;
}

export function formatMs(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }
  return `${Math.round(value)} ms`;
}

export function formatUptime(uptime: number | null): string {
  if (uptime === null || !Number.isFinite(uptime)) {
    return "—";
  }
  const seconds = Math.max(0, Math.floor(uptime));
  const days = Math.floor(seconds / 86_400);
  if (days > 0) {
    return t("days").replace("{count}", String(days));
  }
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  return [hours, minutes]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}
