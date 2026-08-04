module.exports = {
  // Only the esbuild output under public/static and the source assets are packaged.
  // src/framework and public/framework are local dev-shell only and must never ship.
  context: __dirname,
  clientLibRoot: "client-libs",
  // AEM reads cq:ClientLibraryFolder from .content.xml, not the JSON sidecar.
  serializationFormat: "xml",
  libs: [
    {
      name: "asset-picker.spa",
      categories: ["asset-picker.spa"],
      allowProxy: true,
      assets: {
        js: ["public/static/**/*.js"],
        css: ["public/static/**/*.css"],
        resources: {
          files: [
            { src: "public/static/**/*.js", dest: "dynamicJS/" },
            { src: "public/static/**/*.js.map", dest: "dynamicJS/" },
            { src: "public/static/**/*.css", dest: "dynamicCSS/" },
            { src: "public/static/**/*.css.map", dest: "dynamicCSS/" },
            { src: "src/assets/images/**/*.**", dest: "images/" },
          ],
        },
      },
    },
  ],
};
