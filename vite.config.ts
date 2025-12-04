import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true,
    port: Number(process.env.PORT) || 8080,
    allowedHosts: (process.env.ALLOWED_HOSTS || "isola70.onrender.com,festa-f-cil-pro.onrender.com")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    proxy: {
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: true,
    port: Number(process.env.PORT) || 8080,
    allowedHosts: (process.env.ALLOWED_HOSTS || "isola70.onrender.com,festa-f-cil-pro.onrender.com")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
