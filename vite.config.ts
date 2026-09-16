import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { eventApiPlugin } from "./eventApiPlugin";

export default defineConfig({
  plugins: [react(), eventApiPlugin()],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    host: true,
    allowedHosts: true,
  },
});
