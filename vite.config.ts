import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Debug: verificar variáveis de ambiente
console.log("🔍 Vite Config - Variáveis de ambiente:", {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? "✅ Existe" : "❌ Não encontrada",
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? "✅ Existe" : "❌ Não encontrada",
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'charts': ['recharts'],
        },
      },
    },
  },
  // PWA
  manifest: true,
}));
