import { defineConfig } from "vite";
import { browserslistToTargets } from "lightningcss";
import browserslist from "browserslist";

export default defineConfig({
  base: "./",
  logLevel: "warning",
  css: {
    transformer: "lightningcss",
    lightningcss: {
      targets: browserslistToTargets(browserslist("> 0.5%, last 3 versions, not dead, not ie > 0, not samsung > 0, not opera > 0, not op_mob > 0, not op_mini all, not kaios > 0, not baidu > 0, not and_qq > 0, not android > 0, not and_uc > 0")),
    },
  },
  build: {
    emptyOutDir: true,
    cssMinify: "lightningcss",
  },
  outDir: "../dist/subproject",
  server: {
    port: 8081,
  },
});
