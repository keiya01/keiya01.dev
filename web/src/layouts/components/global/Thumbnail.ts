import { html } from "common-tags";

import * as style from "./Thumbnail.css";

import { loadPublicResource } from "../../../helpers/subResourceHelper";

export const Thumbnail = (): string => {
  const thumbnailName = "thumbnail_circle";

  return html`
    <picture class="${style.picture}">
      <source
        srcset="${loadPublicResource(`/image/${thumbnailName}.webp`)}"
        type="image/webp"
      />
      <img
        src="${loadPublicResource(`/image/${thumbnailName}.jpg`)}"
        alt="サムネイル"
        width="60"
        height="60"
        class="${style.img}"
      />
    </picture>
  `;
};
