import { style } from "@vanilla-extract/css";
import { vars } from "../partials/theme.css";

export const container = style({
  display: "flex",
  flexDirection: "column",
  maxWidth: 680,
  width: "100%",
  margin: "50px auto 100px",
});

export const articleHeader = style({
  margin: "30px 0 0",
});

export const title = style({
  margin: "0 0 10px",
  fontSize: 35,
});

export const tagList = style({
  listStyle: "none",
  margin: "10px 0 0",
  display: "flex",
});

export const tagItem = style({
  marginLeft: 7,
  borderRadius: 5,
  backgroundColor: vars.background_tag,
  fontSize: 15,
  selectors: {
    "&:first-child": {
      marginLeft: 0,
    },
  },
});

export const tagLink = style({
  textDecoration: "none",
  display: "inline-block",
  padding: "1px 3px",
});
