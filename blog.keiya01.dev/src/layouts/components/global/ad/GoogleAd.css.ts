import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "../../../partials/theme.css";

export const ad = style({
  margin: "50px auto 0",
  maxWidth: vars.content_width,
  background: vars.background_low,
  boxSizing: "border-box",
  padding: 10,
  borderRadius: 5,
  position: "relative",
});

export const adFragment = style({
  display: "none",
  position: "absolute",
  top: 0,
  left: 0,
  height: "100%",
  fontSize: 18,
  color: vars.color_base,
  background: vars.background_low,
  borderRadius: 5,
  fontWeight: "bold",
  width: "100%",
  alignItems: "center",
  justifyContent: "center",
});

export const adFailed = style({});
globalStyle(
  `${ad} > ins.adsbygoogle[data-ad-status="unfilled"] + ${adFailed}`,
  {
    display: "flex",
  }
);

export const adLoading = style({
  display: "flex",
});
globalStyle(
  `${ad} > ins.adsbygoogle[data-ad-status="filled"] ~ ${adLoading}, ${ad} > ins.adsbygoogle[data-ad-status="unfilled"] ~ ${adLoading}`,
  {
    display: "none",
  }
);
