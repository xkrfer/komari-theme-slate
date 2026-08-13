export function SiteFooter() {
  return (
    <footer className="km-footer mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-8 text-xs text-muted-foreground">
      <span>© {new Date().getFullYear()} Komari</span>
      <span>Powered by Komari Monitor</span>
    </footer>
  );
}
