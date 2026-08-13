import { Link } from "@tanstack/react-router";
import { Activity, Languages, Monitor, Moon, Search, Sun } from "lucide-react";
import { lazy, Suspense } from "react";
import { useLanguage } from "@/components/language-provider";
import { LoginDialog } from "@/components/login-dialog";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { t } from "@/lib/i18n";
import type { MeInfo } from "@/lib/schemas";

const NodeSearch = lazy(() =>
  import("@/components/node-search").then((module) => ({
    default: module.NodeSearch,
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
          <Suspense
            fallback={
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="rounded-lg bg-card shadow-xs"
                aria-label={t("search")}
                disabled
              >
                <Search />
              </Button>
            }
          >
            <NodeSearch />
          </Suspense>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-lg bg-card shadow-xs"
                  aria-label={t("language")}
                  title={t("language")}
                />
              }
            >
              <Languages />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t("language")}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={locale}
                onValueChange={(value) => {
                  if (value === "zh-CN" || value === "en") {
                    setLocale(value);
                  }
                }}
              >
                <DropdownMenuRadioItem value="zh-CN">
                  {t("languageChinese")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="en">
                  {t("languageEnglish")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-lg bg-card shadow-xs"
                  aria-label={t("appearance")}
                  title={t("appearance")}
                />
              }
            >
              <Icon />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuGroup>
                <DropdownMenuLabel>{t("appearance")}</DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(value) => {
                  if (
                    value === "system" ||
                    value === "light" ||
                    value === "dark"
                  ) {
                    setTheme(value);
                  }
                }}
              >
                <DropdownMenuRadioItem value="system">
                  <Monitor />
                  {t("appearanceSystem")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="light">
                  <Sun />
                  {t("appearanceLight")}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon />
                  {t("appearanceDark")}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          {loggedIn ? (
            <Button
              type="button"
              variant="outline"
              size="default"
              className="rounded-sm bg-card px-4 shadow-xs"
              onClick={() => {
                window.location.assign("/admin");
              }}
            >
              {t("admin")}
            </Button>
          ) : (
            <LoginDialog onLoggedIn={onLoggedIn} />
          )}
        </div>
      </div>
    </header>
  );
}
