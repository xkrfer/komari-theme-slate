import { useQueryClient } from "@tanstack/react-query";
import { Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { useLanguage } from "@/components/language-provider";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { useTheme } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { queryKeys, useMe, usePublicInfo } from "@/hooks/use-komari";

export function AppShell() {
  const publicInfo = usePublicInfo();
  const me = useMe();
  const queryClient = useQueryClient();
  const { locale } = useLanguage();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const managed =
      publicInfo.data?.theme_settings.defaultAppearance ?? "system";
    if (!localStorage.getItem("appearance") && theme !== managed) {
      setTheme(managed);
    }
  }, [publicInfo.data?.theme_settings.defaultAppearance, setTheme, theme]);

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
