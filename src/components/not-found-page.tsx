import { Link } from "@tanstack/react-router";
import { ArrowLeft, RouteOff } from "lucide-react";
import { t } from "@/lib/i18n";

export function NotFoundPage() {
  return (
    <main className="km-main mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <section className="w-full max-w-lg overflow-hidden rounded-lg border border-border bg-card shadow-xs">
        <div className="flex items-center justify-between border-b border-border bg-muted/35 px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2">
            <span
              className="size-1.5 rounded-full bg-status-offline"
              aria-hidden="true"
            />
            <p className="text-xs font-medium tracking-wide text-muted-foreground">
              {t("pageNotFoundStatus")}
            </p>
          </div>
          <code className="km-metric rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground">
            404
          </code>
        </div>

        <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-12">
          <div className="mb-6 flex size-16 items-center justify-center rounded-lg border border-data-accent/20 bg-data-accent/6 text-data-accent shadow-xs">
            <RouteOff className="size-7" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("pageNotFoundTitle")}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            {t("pageNotFoundDescription")}
          </p>
          <Link
            to="/"
            className="mt-7 inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs outline-none transition-colors hover:bg-primary/80 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} />
            {t("backToHome")}
          </Link>
        </div>
      </section>
    </main>
  );
}
