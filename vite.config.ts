import { readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const themeManifest = JSON.parse(
    readFileSync(new URL("./komari-theme.json", import.meta.url), "utf8"),
  ) as { version: string };
  const themeVersion =
    process.env.VITE_THEME_VERSION ||
    env.VITE_THEME_VERSION ||
    themeManifest.version;
  const target = env.VITE_API_TARGET || "http://127.0.0.1:25774";
  const targetOrigin = new URL(target).origin;

  return {
    base: "/",
    define: {
      __THEME_VERSION__: JSON.stringify(themeVersion),
    },
    plugins: [
      {
        name: "non-blocking-app-styles",
        apply: "build",
        enforce: "post",
        transformIndexHtml(html) {
          return html.replace(
            /<link rel="stylesheet" crossorigin href="([^"]+)">/g,
            '<link rel="preload" as="style" crossorigin href="$1" onload="this.onload=null;requestAnimationFrame(()=>requestAnimationFrame(()=>this.rel=\'stylesheet\'))">' +
              '<noscript><link rel="stylesheet" crossorigin href="$1"></noscript>',
          );
        },
      },
      tanstackRouter({
        target: "react",
        autoCodeSplitting: true,
        routesDirectory: "./src/routes",
        generatedRouteTree: "./src/routeTree.gen.ts",
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
    optimizeDeps: {
      include: [
        "@base-ui/react/autocomplete",
        "@base-ui/react/button",
        "@base-ui/react/dialog",
        "@base-ui/react/input",
        "@base-ui/react/menu",
        "@base-ui/react/otp-field",
        "@base-ui/react/popover",
        "@base-ui/react/progress",
        "@base-ui/react/select",
        "@base-ui/react/separator",
        "@base-ui/react/switch",
        "@base-ui/react/tabs",
        "@tanstack/react-query",
        "@tanstack/react-router",
        "@tanstack/react-table/legacy",
        "react",
        "react-dom",
        "react-dom/client",
      ],
    },
    build: {
      modulePreload: false,
    },
    server: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: true,
          ws: false,
          configure(proxy) {
            proxy.on("proxyReq", (proxyRequest) => {
              proxyRequest.setHeader("Origin", targetOrigin);
            });
          },
        },
      },
    },
  };
});
