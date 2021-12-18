import { style } from "@vanilla-extract/css";
import { vars } from "../partials/theme.css";

export const container = style({
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: `calc(${vars.header_height} * -1) 0 0`,
  maxWidth: "none",
});

export const title = style({
  fontSize: 100,
  letterSpacing: "0.3em",
  fontWeight: "bold",
  color: vars.color_base,
  margin: 0,
});

export const subtitle = style({
  fontSize: 50,
  fontWeight: "bold",
  color: vars.color_base,
  letterSpacing: "0.1em",
});
