import { composeStyles, globalStyle, style } from "@vanilla-extract/css";
import { vars } from "../../partials/theme.css";

export const header = style({
  width: "100%",
  height: 60,
  background: vars.background_header,
  color: vars.color_header,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const nav = style({
  maxWidth: vars.content_width,
  width: "100%",
  height: "100%",
  padding: "0 20px",
  boxSizing: "border-box",
});

export const list = style({
  listStyle: "none",
  margin: 0,
  display: "flex",
  flex: 1,
  alignItems: "center",
  width: "100%",
  height: "100%",
});

export const item = style({
  margin: "0 10px",
});
globalStyle(`${item} > a`, {
  display: "flex",
  alignItems: "center",
  textDecoration: "none",
  color: vars.color_header,
});

export const titleWrapper = composeStyles(
  item,
  style({
    display: "flex",
    flex: 1,
    margin: 0,
  })
);

export const title = style({
  fontWeight: "bold",
  fontSize: 20,
});
