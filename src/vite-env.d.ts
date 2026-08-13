/// <reference types="vite/client" />

declare const __THEME_VERSION__: string;

declare module "*.json" {
  const value: unknown;
  export default value;
}
