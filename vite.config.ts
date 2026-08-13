import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_TARGET || "http://127.0.0.1:25774";

  return {
    base: "./",
    plugins: [
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
    server: {
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
          secure: true,
          ws: false,
        },
      },
    },
  };
});
