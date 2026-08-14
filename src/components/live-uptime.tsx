import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { formatUptime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const UptimeClockContext = createContext(Date.now());

function refreshMilliseconds(seconds: number) {
  const normalized = Number.isFinite(seconds) ? Math.round(seconds) : 1;
  return Math.min(60, Math.max(1, normalized)) * 1_000;
}

export function UptimeProvider({
  children,
  enabled,
  intervalSeconds,
}: {
  children: ReactNode;
  enabled: boolean;
  intervalSeconds: number;
}) {
  const [now, setNow] = useState(Date.now);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, refreshMilliseconds(intervalSeconds));
    return () => window.clearInterval(timer);
  }, [enabled, intervalSeconds]);

  return (
    <UptimeClockContext.Provider value={now}>
      {children}
    </UptimeClockContext.Provider>
  );
}

function extrapolateUptime(
  uptime: number | null,
  reportedAt: string | undefined,
  now: number,
) {
  if (uptime === null || !Number.isFinite(uptime)) {
    return null;
  }
  const reportedTime = reportedAt ? Date.parse(reportedAt) : Number.NaN;
  const elapsed = Number.isFinite(reportedTime)
    ? Math.max(0, Math.floor((now - reportedTime) / 1_000))
    : 0;
  return Math.max(0, uptime + elapsed);
}

export function LiveUptime({
  uptime,
  reportedAt,
  className,
}: {
  uptime: number | null;
  reportedAt: string | undefined;
  className?: string;
}) {
  const now = useContext(UptimeClockContext);
  const displayValue = formatUptime(extrapolateUptime(uptime, reportedAt, now));

  return (
    <span
      className={cn("km-metric", className)}
      title={`${t("uptime")}: ${displayValue}`}
    >
      {displayValue}
    </span>
  );
}
