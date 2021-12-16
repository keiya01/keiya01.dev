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
  "@media": {
    "(prefers-reduced-motion: reduce)": {
      transition: "none",
    },
  },
});

globalStyle("main", {
  display: "flex",
  flexDirection: "column",
  maxWidth: vars.content_width,
  width: "100%",
  margin: "50px auto 100px",
  boxSizing: "border-box",
});

/**
 * TODO: 記事用のstyleをentry.cssに移動する
 */

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
  width: "100%",
  color: vars.color_base,
  textDecoration: "none",
  display: "inline-block",
});

globalStyle("h2 > a", {
  padding: "0 0 6px",
  borderBottom: `1px solid ${vars.color_base}`,
});

globalStyle(":is(h2, h3, h4) > a:hover", {
  "@media": {
    "(hover: hover)": {
      color: vars.color_link,
      borderBottomColor: vars.color_link,
    },
  },
});

globalStyle(":not(h2, h3, h4) > a", {
  color: vars.color_link,
});

globalStyle(":not(h2, h3, h4) > a:hover", {
  "@media": {
    "(hover: hover)": {
      color: vars.color_active_link,
    },
  },
});

globalStyle("ul", {
  padding: 0,
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

export const wrapper = style({
  margin: "0 20px",
});
