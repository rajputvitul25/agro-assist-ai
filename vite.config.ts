import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy /tlm -> https://www.useblackbox.io/tlm to avoid CORS in dev
      '/tlm': {
        target: 'https://www.useblackbox.io',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/tlm/, '/tlm')
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
