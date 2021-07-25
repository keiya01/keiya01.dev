import { style } from "@vanilla-extract/css";

export const title = style({
  margin: "0 0 10px",
  fontSize: 35,
  "@media": {
    "screen and (max-width: 375px)": {
      fontSize: 30,
    },
  },
});

export const tagList = style({
  margin: "10px 0 0",
});
