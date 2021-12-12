import { html } from "common-tags";
import * as style from "./GoogleAd.css";

type Props = {
  slot: string;
  format: "horizontal" | "rectangle" | "vertical";
  height: number;
};

export const GoogleAd = ({ slot, format, height }: Props) => {
  return html`
    <div class="${style.ad}" style="min-height: ${height}px">
      <ins
        class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-3516148173857150"
        data-ad-slot="${slot}"
        data-ad-format="${format}"
        data-full-width-responsive="${format === "horizontal"
          ? "false"
          : "true"}"
      ></ins>
      <div class=" ${style.adFailed} ${style.adFragment}">
        広告を表示できませんでした。
      </div>
      <div class="${style.adLoading} ${style.adFragment}">
        広告を読み込んでいます...
      </div>
    </div>
  `;
};
