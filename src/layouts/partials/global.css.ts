import { assignVars, globalStyle, style } from "@vanilla-extract/css";
import { darkVars, lightVars, vars } from "./theme.css";

globalStyle("html", {
  vars: assignVars(vars, darkVars),
  lineHeight: 1.8,
  fontSize: 16,
  color: vars.color_base,
  scrollBehavior: "smooth",
  fontFamily: `"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;`,
  "@media": {
    "(prefers-color-scheme: light)": {
      vars: assignVars(vars, lightVars),
    },
    "(prefers-reduced-motion: reduce)": {
      scrollBehavior: "auto",
    },
  },
});

globalStyle("body", {
  margin: 0,
  minHeight: "100%",
  height: "100%",
  width: "100%",
  backgroundColor: vars.background_base,
});

globalStyle("main", {
  display: "flex",
  flexDirection: "column",
  maxWidth: vars.content_width,
  width: "100%",
  margin: "50px auto 100px",
  boxSizing: "border-box",
});

globalStyle("h2, h3, h4", {
  margin: "50px 0 30px",
  width: "100%",
});

globalStyle(":is(h2, h3, h4) > a", {
  padding: "0 0 6px",
  width: "100%",
  borderBottom: `1px solid ${vars.color_base}`,
  textDecoration: "none",
  display: "inline-block",
});

globalStyle(":is(h2, h3, h4) > a:hover", {
  color: vars.color_header_link,
  borderBottomColor: vars.color_header_link,
});

globalStyle("h2", {
  fontSize: 25,
});

globalStyle("h3", {
  fontSize: 22,
});

globalStyle("h4", {
  fontSize: 19,
});

globalStyle("pre, code", {
  backgroundColor: vars.background_code,
});

globalStyle("pre", {
  padding: 10,
  borderRadius: 5,
  overflow: "auto",
});

globalStyle("code", {
  borderRadius: 3,
  padding: "1px 4px",
  margin: "0 2px",
  color: vars.color_code,
});

globalStyle("ul", {
  padding: 0,
  marginLeft: 20,
});

globalStyle("li", {
  margin: "5px 0",
});

globalStyle("a", {
  color: vars.color_base,
});

globalStyle("p, time, span", {
  padding: 0,
  margin: 0,
});

globalStyle(":is(a, button):focus", {
  outline: `3px solid ${vars.outline_color}`,
  outlineOffset: -3,
});

globalStyle(":is(a, button):focus:not(:focus-visible)", {
  outline: "none",
});

export const wrapper = style({
  margin: "0 20px",
});
