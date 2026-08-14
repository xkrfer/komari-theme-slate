import { Link } from "@tanstack/react-router";
import {
  Activity,
  CircleUserRound,
  Languages,
  LogIn,
  Monitor,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { useLanguage } from "@/components/language-provider";
import { useTheme } from "@/components/theme-provider";
import { t } from "@/lib/i18n";
import type { MeInfo } from "@/lib/schemas";

const NodeSearch = lazy(() =>
  import("@/components/node-search").then((module) => ({
    default: module.NodeSearch,
  })),
);

const LoginDialog = lazy(() =>
  import("@/components/login-dialog").then((module) => ({
    default: module.LoginDialog,
  })),
);

export function SiteHeader({
  sitename,
  me,
  onLoggedIn,
}: {
  sitename: string;
  me: MeInfo | undefined;
  onLoggedIn: () => void;
}) {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale } = useLanguage();
  const loggedIn = Boolean(me?.logged_in);
  const Icon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const [searchLoaded, setSearchLoaded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [loginLoaded, setLoginLoaded] = useState(false);
  const iconButtonClass =
    "inline-flex size-8 items-center justify-center rounded-lg border border-border bg-card shadow-xs outline-none transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-4";

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchLoaded(true);
        setSearchOpen((current) => !current);
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return (
    <header className="km-navbar bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-sm">
            <Activity className="size-4" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm leading-5 font-semibold tracking-tight">
              {sitename || "Slate"}
            </span>
            <span className="truncate text-xs leading-4 text-muted-foreground">
              Monitoring
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-1.5">
          {searchLoaded ? (
            <Suspense
              fallback={
                <button
                  type="button"
                  className={iconButtonClass}
                  aria-label={t("search")}
                  disabled
                >
                  <Search />
                </button>
              }
            >
              <NodeSearch open={searchOpen} onOpenChange={setSearchOpen} />
            </Suspense>
          ) : (
            <button
              type="button"
              className={iconButtonClass}
              aria-label={t("search")}
              title={`${t("search")} (⌘/Ctrl K)`}
              onClick={() => {
                setSearchLoaded(true);
                setSearchOpen(true);
              }}
            >
              <Search />
            </button>
          )}
          <label
            className={`relative ${iconButtonClass}`}
            title={t("language")}
          >
            <span className="sr-only">{t("language")}</span>
            <Languages />
            <select
              value={locale}
              aria-label={t("language")}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
              onChange={(event) => {
                const value = event.target.value;
                if (value === "zh-CN" || value === "en") {
                  setLocale(value);
                }
              }}
            >
              <option value="zh-CN">{t("languageChinese")}</option>
              <option value="en">{t("languageEnglish")}</option>
            </select>
          </label>

          <label
            className={`relative ${iconButtonClass}`}
            title={t("appearance")}
          >
            <span className="sr-only">{t("appearance")}</span>
            <Icon />
            <select
              value={theme}
              aria-label={t("appearance")}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
              onChange={(event) => {
                const value = event.target.value;
                if (
                  value === "system" ||
                  value === "light" ||
                  value === "dark"
                ) {
                  setTheme(value);
                }
              }}
            >
              <option value="system">{t("appearanceSystem")}</option>
              <option value="light">{t("appearanceLight")}</option>
              <option value="dark">{t("appearanceDark")}</option>
            </select>
          </label>
          {loggedIn ? (
            <button
              type="button"
              className={iconButtonClass}
              aria-label={t("admin")}
              title={t("admin")}
              onClick={() => {
                window.location.assign("/admin");
              }}
            >
              <CircleUserRound />
            </button>
          ) : loginLoaded ? (
            <Suspense
              fallback={
                <button
                  type="button"
                  className={iconButtonClass}
                  aria-label={t("login")}
                  disabled
                >
                  <LogIn />
                </button>
              }
            >
              <LoginDialog onLoggedIn={onLoggedIn} initiallyOpen />
            </Suspense>
          ) : (
            <button
              type="button"
              className={iconButtonClass}
              aria-label={t("login")}
              title={t("login")}
              onClick={() => setLoginLoaded(true)}
            >
              <LogIn />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
