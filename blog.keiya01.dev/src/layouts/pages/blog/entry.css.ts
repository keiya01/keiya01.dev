import { globalStyle, style } from "@vanilla-extract/css";
import { vars } from "../../partials/theme.css";

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

export const content = style({});
globalStyle(`${content} > p`, {
  margin: "45px 0 0",
});
globalStyle(`${content} > :is(h2, h3) + :is(p, ul, pre, blockquote)`, {
  marginTop: 0,
});
globalStyle(`${content} :is(pre[class*="language-"], code)`, {
  background: vars.background_code,
});
globalStyle(`${content} > pre`, {
  padding: 10,
  borderRadius: 5,
  overflow: "auto",
  marginTop: 45,
});
globalStyle(`${content} > :is(h2, h3, p, span, ul, a) code`, {
  borderRadius: 3,
  padding: "1px 4px",
  margin: "0 4px",
  color: vars.color_code,
  overflow-wrap: "break-word",
});
globalStyle(`${content} > ul`, {
  marginTop: 45,
});
globalStyle(`${content} ul`, {
  marginLeft: 20,
});
globalStyle(`${content} ul > li`, {
  margin: "5px 0",
});
globalStyle(`${content} > blockquote`, {
  margin: "2em 40px",
  borderLeft: `5px solid ${vars.border_blockquote}`,
  padding: "10px 0 10px 20px",
  marginTop: 45,
});
globalStyle(`${content} > p img`, {
  maxWidth: "100%",
  height: "auto",
  objectFit: "contain",
  display: "block",
  border: `1px solid ${vars.border_boundary_color}`,
  borderRadius: 10,
  margin: "0 auto",
});
globalStyle(`${content} a`, {
  margin: "0 4px",
});
