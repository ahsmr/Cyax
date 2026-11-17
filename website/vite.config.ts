import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ["react", "react-dom", "@xyflow/react"],
    alias: {
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "lucide-react": path.resolve(__dirname, "node_modules/lucide-react"),
      "@xyflow/react": path.resolve(__dirname, "node_modules/@xyflow/react"),
      katex: path.resolve(__dirname, "node_modules/katex"),
      "react-katex": path.resolve(__dirname, "node_modules/react-katex"),
    },
  },
});