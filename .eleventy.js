const { readFileSync } = require("fs");
const { resolve } = require("path");

const loadJSON = (filePath) => {
  return JSON.parse(readFileSync(filePath, "utf8"));
};

let _Pages = null;
const loadPages = () => {
  if (_Pages) {
    return _Pages;
  }
  _Pages = loadJSON(resolve(__dirname, "./dist/manifest.json")).pages;
  return _Pages;
};

module.exports = function (config) {
  config.addPassthroughCopy({ public: "./" });

  config.setBrowserSyncConfig({
    files: ["dist/**/*"],
  });

  const pages = loadPages();
  Object.values(pages).map((page) => {
    const filename = page.split("/").slice(-1)[0];
    const name = filename.split(".")[0];
    config.addLayoutAlias(name, filename);
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
