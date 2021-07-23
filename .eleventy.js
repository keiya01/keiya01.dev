module.exports = function (config) {
  config.addPassthroughCopy({ public: "./" });

  config.setBrowserSyncConfig({
    files: ["dist/**/*"],
  });

  return {
    templateFormats: ["md"],
    dir: {
      input: "src/contents",
      output: "dist/site",
      layouts: "../../dist/layouts",
      includes: "../../dist/lib",
    },
  };
};
