import { assignVars, globalStyle, style } from "@vanilla-extract/css";
import { darkVars, lightVars, vars } from "./theme.css";

const assignableThemeVars = {
  dark: assignVars(vars, darkVars),
  light: assignVars(vars, lightVars),
};

globalStyle("html", {
  vars: assignableThemeVars.dark,
  lineHeight: 1.8,
  fontSize: 16,
  color: vars.color_base,
  scrollBehavior: "smooth",
  fontFamily: `"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif;`,
  "@media": {
    "(prefers-color-scheme: light)": {
      vars: assignableThemeVars.light,
    },
    "(prefers-reduced-motion: reduce)": {
      scrollBehavior: "auto",
    },
  },
});

globalStyle("html[data-color-scheme='dark']", {
  vars: assignableThemeVars.dark,
});

globalStyle("html[data-color-scheme='light']", {
  vars: assignableThemeVars.light,
});

globalStyle("body", {
  margin: 0,
  minHeight: "100%",
  height: "100%",
  width: "100%",
  background: vars.background_base,
  transition: "background ease-in 0.1s",
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

globalStyle("h2", {
  fontSize: 25,
});

globalStyle("h3", {
  fontSize: 22,
});

globalStyle("h4", {
  fontSize: 19,
});

globalStyle(":is(h2, h3, h4) > a", {
  padding: "0 0 6px",
  width: "100%",
  color: vars.color_base,
  borderBottom: `1px solid ${vars.color_base}`,
  textDecoration: "none",
  display: "inline-block",
});

globalStyle(":is(h2, h3, h4) > a:hover", {
  "@media": {
    "(hover: hover)": {
      color: vars.color_link,
      borderBottomColor: vars.color_link,
    },
  },
});

globalStyle("p > a", {
  color: vars.color_link,
});

globalStyle("p > a:hover", {
  "@media": {
    "(hover: hover)": {
      color: vars.color_active_link,
    },
  },
});

globalStyle("pre, code", {
  background: vars.background_code,
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
  outline: "none",
  boxShadow: vars.outline_box_shadow,
});

globalStyle(":is(a, button):focus:not(:focus-visible)", {
  boxShadow: "none",
});

globalStyle("blockquote", {
  margin: "2em 40px",
  borderLeft: `5px solid ${vars.border_blockquote}`,
  padding: "10px 0 10px 20px",
});

globalStyle("p > img", {
  maxWidth: "100%",
  height: "auto",
  objectFit: "contain",
});

globalStyle("p > img", {
  display: "block",
  border: `1px solid ${vars.border_boundary_color}`,
  borderRadius: 10,
  margin: "20px auto",
});

export const wrapper = style({
  margin: "0 20px",
});
