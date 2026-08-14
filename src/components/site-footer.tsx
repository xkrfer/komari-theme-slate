import { useServerVersion } from "@/hooks/use-komari";
import { t } from "@/lib/i18n";

const THEME_URL = "https://github.com/xkrfer/komari-theme-slate";
const KOMARI_URL = "https://github.com/komari-monitor/komari";

export function SiteFooter({ sitename }: { sitename: string }) {
  const displayName = sitename || "Slate";
  const serverVersion = useServerVersion();
  const backendVersion = serverVersion.data?.version.trim();

  return (
    <footer className="km-footer mt-8">
      <div className="mx-auto grid w-full max-w-6xl gap-2 px-4 py-5 text-center text-[11px] font-light tracking-tight text-muted-foreground sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:text-left">
        <p>
          © {new Date().getFullYear()} {displayName}
        </p>

        <div className="flex items-center justify-center gap-0.5">
          <p>Powered by Komari Monitor.</p>
          {/* 点线分隔 */}
          <span className="text-foreground/75">·</span>
          <p className="flex items-center justify-center gap-1.5">
            <span>Made with</span>
            <span aria-label="love" role="img">
              ❤️
            </span>
            <span>for Komari</span>
          </p>
        </div>

        <p className="flex items-center justify-center gap-1.5 font-mono text-[10px] sm:justify-end">
          {backendVersion ? (
            <a
              href={KOMARI_URL}
              target="_blank"
              rel="noreferrer"
              className="cursor-pointer text-foreground/75 underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
            >
              {t("footerBackend")} v{backendVersion}
            </a>
          ) : null}
          {backendVersion ? <span aria-hidden="true">·</span> : null}
          <a
            href={THEME_URL}
            target="_blank"
            rel="noreferrer"
            className="cursor-pointer text-foreground/75 underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
          >
            {t("footerTheme")} v{__THEME_VERSION__}
          </a>
        </p>
      </div>
    </footer>
  );
}
