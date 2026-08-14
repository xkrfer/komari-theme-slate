import { useQueryClient } from "@tanstack/react-query";
import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useTheme } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import {
  queryKeys,
  useLiveStatus,
  useMe,
  usePublicInfo,
} from "@/hooks/use-komari";
import { LANGUAGE_KEY, resolveDefaultLocale } from "@/lib/i18n";

export function AppShell() {
  const publicInfo = usePublicInfo();
  const me = useMe();
  const queryClient = useQueryClient();
  const { locale, setDefaultLocale } = useLanguage();
  const { theme, setDefaultTheme } = useTheme();
  const loggedIn = Boolean(me.data?.logged_in);
  useLiveStatus(loggedIn);

  useEffect(() => {
    const managed =
      publicInfo.data?.theme_settings.defaultAppearance ?? "system";
    if (!localStorage.getItem("appearance") && theme !== managed) {
      setDefaultTheme(managed);
    }
  }, [
    publicInfo.data?.theme_settings.defaultAppearance,
    setDefaultTheme,
    theme,
  ]);

  useEffect(() => {
    if (localStorage.getItem(LANGUAGE_KEY)) {
      return;
    }
    const managed = publicInfo.data?.theme_settings.defaultLanguage ?? "auto";
    const nextLocale = resolveDefaultLocale(managed);
    if (locale !== nextLocale) {
      setDefaultLocale(nextLocale);
    }
  }, [
    locale,
    publicInfo.data?.theme_settings.defaultLanguage,
    setDefaultLocale,
  ]);

  return (
    <div
      key={locale}
      className="km-layout flex min-h-svh flex-col bg-background text-foreground"
    >
      <SiteHeader
        sitename={publicInfo.data?.sitename ?? "Slate"}
        me={me.data}
        onLoggedIn={() => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.me });
          void queryClient.invalidateQueries({ queryKey: queryKeys.nodes });
        }}
      />
      <Outlet />
      <SiteFooter sitename={publicInfo.data?.sitename ?? "Slate"} />
      <Toaster />
    </div>
  );
}
