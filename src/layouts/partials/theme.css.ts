import { createThemeContract } from "@vanilla-extract/css";

export const darkVars = {
  color_base: "#fff",
  color_code: "#fff",
  color_header: "#fff",
  color_visited: "#a3657d",
  color_header_link: "#c57aff",
  color_twitter: "#1da1f2",

  background_base: "#27222a",
  background_code: "#0d0017",
  background_tag: "#570099",
  background_header: "#1e0036",

  outline_color: "#870144",

  content_width: "680px",
};

export const lightVars = {
  ...darkVars,
  color_visited: "#8a0035",
  color_header_link: "#9000ff",
  color_base: "#27222a",
  background_base: "#fff",
  background_tag: "#d6a1ff",
};

export const vars = createThemeContract(darkVars);
