import { defineConfig } from "vite";

export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: "index.html",
    },
    // Add this section to copy the robot01.glb file to the assets folder
    copyPublicDir: {
      patterns: [{ from: "assets/robot01.glb", to: "assets" }],
    },
  },
  server: {
    open: true,
  },
  publicDir: "assets",
});
