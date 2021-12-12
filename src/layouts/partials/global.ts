import { html } from "common-tags";
import { ORIGIN } from "../../constants/origin";
import { PROFILE_TWITTER_URL } from "../../constants/profile";
import {
  loadPageScript,
  loadPublicResource,
  loadPageStyle,
  loadStyle,
} from "../../helpers/subResourceHelper";
import { EleventyProps, EleventyShortCode } from "../../types/eleventy";
import { getFormattedDate } from "../../utils/date";
import { Header } from "../components/global/Header";

import * as style from "../partials/global.css";

const getOGType = (layout: string) =>
  layout === "blog/entry" ? "article" : "website";

const getJsonLD = (
  isEntry: boolean,
  data: {
    title: string;
    description: string;
    ogImageName?: string;
    publishedAt?: string;
    modifiedAt?: string;
  }
) =>
  isEntry
    ? {
        "@context": "https://schema.org/",
        "@type": "BlogPosting",
        author: {
          "@type": "Person",
          url: PROFILE_TWITTER_URL,
          name: "Keiya Sasaki",
          image: `${ORIGIN}/public/image/icon.png`,
        },
        publisher: {
          "@type": "Organization",
          name: "Keiya Sasaki",
          logo: {
            "@type": "ImageObject",
            url: `${ORIGIN}/public/image/icon.png`,
          },
        },
        headline: data.title,
        ...(data.ogImageName
          ? { image: [`${ORIGIN}/entry/${data.ogImageName}`] }
          : {}),
        ...(data.publishedAt
          ? {
              datePublished: new Date(
                getFormattedDate(data.publishedAt)
              ).toISOString(),
            }
          : {}),
        ...(data.modifiedAt
          ? {
              dateModified: new Date(
                getFormattedDate(data.modifiedAt)
              ).toISOString(),
            }
          : {}),
        description: data.description,
      }
    : {
        "@context": "https://schema.org/",
        "@type": "WebSite",
        author: {
          "@type": "Person",
          url: PROFILE_TWITTER_URL,
          name: "Keiya Sasaki",
          image: `${ORIGIN}/public/image/icon.png`,
        },
        description: data.description,
        url: ORIGIN,
      };

const setTitle = (title: string) => `${title} - blog.keiya01.dev`;

export const render = async function (
  this: EleventyShortCode,
  {
    layout,
    title,
    content,
    publics,
    description,
    ogImageName,
    ogImageAlt,
    page,
    modified,
    renderData,
  }: EleventyProps
): Promise<string> {
  const globalScript = loadPageScript("global");
  const pageScript = loadPageScript(layout);
  const pageStyle = loadPageStyle(layout);

  const isEntry = layout === "blog/entry";

  const defaultTitle = "blog";
  const defaultDescription =
    "Web標準やJavaScriptの話題を中心に書いていこうかなと思っています🕸";

  if (ogImageName) {
    await this.writeOGImage({ filename: ogImageName, title });
  }

  return html`<!DOCTYPE html>
    <html lang="ja">
      <head>
        <title>${setTitle(renderData?.title || title || defaultTitle)}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta
          name="description"
          content="${description || defaultDescription}"
        />
        <meta name="color-scheme" content="dark light" />

        <!-- === OGP meta === -->
        <meta name="og:type" content="${getOGType(layout)}" />
        <meta
          name="og:url"
          content="${isEntry ? `${ORIGIN}/entry/${ogImageName}` : ""}"
        />
        <meta
          name="og:title"
          content="${setTitle(renderData?.title || title || defaultTitle)}"
        />
        <meta
          name="og:description"
          content="${description || defaultDescription}"
        />
        <meta
          property="og:image"
          content="${ORIGIN}/public/ogp/${ogImageName}.jpg"
        />
        <meta
          property="og:image:alt"
          content="${isEntry ? title : ogImageAlt || defaultTitle}"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="${setTitle(renderData?.title || title || defaultTitle)}"
        />

        <!-- === Structured data === -->
        <script type="application/ld+json">
          ${JSON.stringify(
            getJsonLD(isEntry, {
              title: setTitle(renderData?.title || title || defaultTitle),
              description: description || defaultDescription,
              publishedAt: page.date,
              modifiedAt: modified,
              ogImageName,
            })
          )}
        </script>

        <link rel="manifest" href="/manifest.json" />

        <link rel="stylesheet" href="${loadStyle("partials/global")}" />
        <link rel="stylesheet" href="${loadStyle(`pages/${layout}`)}" />
        ${pageStyle && html`<link rel="stylesheet" href="${pageStyle}" />`}
        ${publics?.map(
          (path) =>
            html`<link rel="stylesheet" href="${loadPublicResource(path)}" />`
        )}
        ${globalScript &&
        html`<script type="module" src="${globalScript}"></script>`}
        ${pageScript &&
        html`<script type="module" src="${pageScript}"></script>`}
      </head>
      <body>
        ${Header()}
        <div class="${style.wrapper}">${content}</div>
        <script>
          (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
      </body>
    </html>`;
};
