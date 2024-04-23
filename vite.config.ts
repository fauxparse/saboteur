import * as path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";
import Unfonts from "unplugin-fonts/vite";

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
    Unfonts({
      custom: {
        families: [
          {
            name: "Cooper",
            local: "Cooper Black",
            src: "./src/assets/fonts/CooperStd-Black.otf",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
