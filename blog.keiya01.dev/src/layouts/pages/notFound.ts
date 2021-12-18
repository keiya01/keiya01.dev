import { html } from "common-tags";

import { EleventyData } from "../../types/eleventy";

import * as style from "./notFound.css";

export const data: EleventyData = {
  layout: "global",
};

export const render = (): string => {
  return html`
    <main class="${style.container}">
      <h1 class="${style.title}">404</h1>
      <p class="${style.subtitle}">Not Found</p>
    </main>
  `;
};
