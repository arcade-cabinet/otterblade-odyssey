import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  root: ".",
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "../attached_assets"),
      "@proofs": path.resolve(__dirname, "src"),
    },
  },
  server: {
    port: 5001,
    host: "0.0.0.0",
  },
});
