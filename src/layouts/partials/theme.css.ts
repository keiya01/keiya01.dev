import { createThemeContract } from "@vanilla-extract/css";

export const darkVars = {
  color_base: "#fff",
  color_code: "#fff",
  color_header_link: "#c57aff",
  background_base: "#0d0017",
  background_code: "#29242e",
  background_tag: "#570099",
};

export const lightVars = {
  ...darkVars,
  color_header_link: "#9000ff",
  color_base: "#0d0017",
  background_base: "#fff",
  background_tag: "#d6a1ff",
};

export const vars = createThemeContract(darkVars);
