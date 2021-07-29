import { style } from "@vanilla-extract/css";
import { vars } from "../../partials/theme.css";

export const list = style({
  listStyle: "none",
  margin: 0,
});

export const profile = style({
  maxWidth: vars.content_width,
  width: "100%",
  margin: "50px auto 0",
  fontSize: 18,
  display: "flex",
  alignItems: "center",
});

export const thumbnail = style({
  marginRight: 8,
});

export const profileContent = style({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
});

export const profileLabel = style({
  fontWeight: "bold",
  fontSize: 15,
});

export const profileName = style({
  textDecoration: "none",
  boxShadow: `0 1px 0 0 currentColor`,
  fontSize: 16,
  ":hover": {
    color: vars.color_header_link,
  },
});
