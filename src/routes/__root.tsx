import { createRootRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { NotFoundPage } from "@/components/not-found-page";

export const Route = createRootRoute({
  component: AppShell,
  notFoundComponent: NotFoundPage,
});
