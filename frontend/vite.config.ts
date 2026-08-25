import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          animations: ["framer-motion", "gsap"],
          forms: ["@hookform/resolvers", "react-hook-form", "zod"],
          icons: ["lucide-react"],
          query: ["@tanstack/react-query", "axios", "zustand"],
          react: ["react", "react-dom", "react-router"],
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
