import { style } from "@vanilla-extract/css";
import { vars } from "../../partials/theme.css";

export const item = style({
  display: "flex",
  flexDirection: "column",
  fontSize: 20,
  marginTop: 30,
  paddingTop: 30,
  borderTop: `1px solid ${vars.color_base}`,
  selectors: {
    "&:first-child": {
      marginTop: 0,
      paddingTop: 0,
      borderTop: "none",
    },
  },
});

export const title = style({
  margin: 0,
});

export const titleLink = style({
  textDecoration: "none",
  border: "none",
  padding: 0,
  ":visited": {
    color: vars.color_visited,
  },
});

export const description = style({
  fontSize: 16,
  lineHeight: 1.5,
  padding: "5px 0",
});

export const footer = style({
  display: "flex",
  width: "100%",
  alignItems: "center",
  flexWrap: "wrap",
});

export const tabList = style({
  display: "flex",
  flex: 1,
  width: "100%",
});

export const date = style({
  fontSize: 15,
});
