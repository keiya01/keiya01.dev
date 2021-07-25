import { style } from "@vanilla-extract/css";
import { vars } from "../../partials/theme.css";

export const picture = style({
  display: "flex",
  alignItems: "center",
});

export const img = style({
  borderRadius: "50%",
  border: `2px solid ${vars.color_base}`,
});
