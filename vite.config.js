import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: "index.html",
    },
    // Add this section to copy the robot01.glb file to the dist root
    copyPublicDir: {
      patterns: [{ from: "robot01.glb", to: "" }],
    },
  },
  server: {
    open: true,
  },
});
