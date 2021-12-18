import { createThemeContract } from "@vanilla-extract/css";

export const darkVars = {
  color_base: "#fff",
  color_code: "#fff",
  color_header: "#fff",
  color_visited: "#a3657d",
  color_link: "#c57aff",
  color_active_link: "#deb3ff",
  color_twitter: "#1da1f2",

  background_base: "#27222a",
  background_code: "#141414",
  background_tag: "#570099",
  background_header: "#1e0036",
  background_low: "#67616b",

  border_blockquote: "#9684a3",

  border_boundary_color: "#4c464f",

  outline_box_shadow: "0 0 0 3px #870144",
  outline_box_shadow_inset: "0 0 0 3px #870144 inset",

  content_width: "680px",
  header_height: "60px",
};

export const lightVars = {
  ...darkVars,
  color_visited: "#8a0035",
  color_link: "#9000ff",
  color_active_link: "#bb63ff",
  color_base: "#27222a",
  background_base: "#fff",
  background_tag: "#d6a1ff",
  background_code: "#272329",
  background_low: "#b8b5ba",
  border_blockquote: "#64566e",
  border_boundary_color: "#c4bdc9",
};

export const vars = createThemeContract(darkVars);
