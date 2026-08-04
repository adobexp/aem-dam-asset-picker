import esbuild from "esbuild";
import svgr from "esbuild-plugin-svgr";
import { postcssModules, sassPlugin } from "esbuild-sass-plugin";

// Production clientlib build. Intentionally excludes src/framework/** which is
// local-only server-side tooling and must not ship as AEM clientlibs.
esbuild
  .build({
    entryPoints: ["./src/index.tsx"],
    outdir: "./public/static",
    bundle: true,
    minify: true,
    platform: "browser",
    metafile: true,
    // IIFE so the AEM clientlib loader can include the bundle without type=module.
    format: "iife",
    globalName: "AssetPickerSpa",
    splitting: false,
    loader: {
      ".tsx": "tsx",
      ".svg": "text",
      ".png": "binary",
      ".woff": "dataurl",
      ".woff2": "dataurl",
      ".eot": "dataurl",
      ".ttf": "dataurl",
    },
    define: {
      "process.env.NODE_ENV": "'production'",
      "process.env.API": JSON.stringify(""),
    },
    sourcemap: true,
    plugins: [
      sassPlugin({
        filter: /\.module\.scss$/,
        transform: postcssModules({}),
      }),
      sassPlugin({
        filter: /\.scss$/,
      }),
      svgr(),
    ],
  })
  .then(() => console.log("⚡ Done : CSS & JS"))
  .catch((e) => {
    console.log("[JMD] : ERROR JS DETECTED", e);
    return process.exit(1);
  });
