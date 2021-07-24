import { style } from "@vanilla-extract/css";

import "../article.css";

export const theme = style({
  margin: 0,
  minHeight: "100%",
  height: "100%",
  width: "100%",
  backgroundColor: "#280042",
});

export const container = style({
  display: "flex",
  flexDirection: "column",
  maxWidth: 680,
  width: "100%",
  margin: "50px auto 100px",
});
