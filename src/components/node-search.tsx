import { Autocomplete } from "@base-ui/react/autocomplete";
import { useNavigate } from "@tanstack/react-router";
import { CornerDownLeft, MapPin, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNodeStatus, useNodes } from "@/hooks/use-komari";
import { t } from "@/lib/i18n";
import { regionToFlagEmoji } from "@/lib/region";
import type { Client } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const SEARCH_RESULT_LIMIT = 20;

function searchableText(client: Client) {
  return client.name.toLocaleLowerCase();
}

export function NodeSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const nodes = useNodes();
  const status = useNodeStatus();
  const navigate = useNavigate();
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const results = useMemo(() => {
    const clients = nodes.data ?? [];
    const matching = normalizedQuery
      ? clients.filter((client) =>
          searchableText(client).includes(normalizedQuery),
        )
      : clients;
    return matching.slice(0, SEARCH_RESULT_LIMIT);
  }, [nodes.data, normalizedQuery]);

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen);
    if (!nextOpen) setQuery("");
  }

  function selectNode(client: Client) {
    handleOpenChange(false);
    void navigate({
      to: "/instance/$uuid",
      params: { uuid: client.uuid },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="rounded-lg bg-card shadow-xs"
            aria-label={t("search")}
            title={`${t("search")} (⌘/Ctrl K)`}
          />
        }
      >
        <Search />
      </DialogTrigger>
      <DialogContent
        className="gap-0 overflow-hidden rounded-lg p-0 sm:max-w-lg"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{t("searchNodes")}</DialogTitle>
          <DialogDescription>{t("searchDescription")}</DialogDescription>
        </DialogHeader>
        <Autocomplete.Root
          items={results}
          value={query}
          onValueChange={setQuery}
          mode="none"
          inline
          open
          autoHighlight="always"
          itemToStringValue={(client) => client.name || client.uuid}
        >
          <div className="flex h-13 items-center gap-3 border-b px-4">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Autocomplete.Input
              autoFocus
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchNodes")}
              className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden rounded-md border bg-muted px-1.5 py-0.5 font-sans text-[10px] text-muted-foreground sm:inline-flex">
              ESC
            </kbd>
          </div>
          <div className="px-2 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted-foreground">
            {t("servers")}
          </div>
          {results.length === 0 ? (
            <Autocomplete.Empty className="flex min-h-32 flex-col items-center justify-center px-6 text-center">
              <Search className="mb-2 size-5 text-muted-foreground/50" />
              <p className="text-sm font-medium">{t("searchEmpty")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("searchEmptyHint")}
              </p>
            </Autocomplete.Empty>
          ) : (
            <Autocomplete.List className="ui-scroll max-h-80 scroll-py-1 px-2 pb-2 outline-none">
              {(client: Client) => {
                const online = status.data?.[client.uuid]?.online ?? false;
                const flag = regionToFlagEmoji(client.region);
                return (
                  <Autocomplete.Item
                    key={client.uuid}
                    value={client}
                    onClick={() => selectNode(client)}
                    className="group flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 outline-none transition-colors hover:bg-muted/60 data-highlighted:bg-muted data-highlighted:text-foreground"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-card text-base shadow-xs">
                      {flag ? (
                        <span aria-hidden="true">{flag}</span>
                      ) : (
                        <MapPin className="size-4 text-muted-foreground" />
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {client.name}
                      </span>
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          online
                            ? "km-status-pulse bg-status-online"
                            : "bg-status-offline",
                        )}
                        role="img"
                        aria-label={online ? t("online") : t("offline")}
                        title={online ? t("online") : t("offline")}
                      />
                    </span>
                    <CornerDownLeft className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-data-highlighted:opacity-100" />
                  </Autocomplete.Item>
                );
              }}
            </Autocomplete.List>
          )}
          <div className="flex items-center justify-between border-t bg-muted/35 px-4 py-2 text-[10px] text-muted-foreground">
            <span>{t("searchNavigateHint")}</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border bg-background px-1.5 py-0.5 font-sans">
                ⌘/Ctrl
              </kbd>
              <kbd className="rounded border bg-background px-1.5 py-0.5 font-sans">
                K
              </kbd>
            </span>
          </div>
        </Autocomplete.Root>
      </DialogContent>
    </Dialog>
  );
}
