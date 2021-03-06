import { style } from "@vanilla-extract/css";
import { vars } from "../../partials/theme.css";

export const tagItem = style({
  marginLeft: 7,
  borderRadius: 5,
  background: vars.background_tag,
  fontSize: 14,
  selectors: {
    "&:first-child": {
      marginLeft: 0,
    },
  },
});

export const tagLink = style({
  textDecoration: "none",
  borderRadius: 5,
  display: "inline-block",
  padding: "1px 3px",
  color: vars.color_base,
  ":focus": {
    boxShadow: vars.outline_box_shadow_inset,
  },
});
