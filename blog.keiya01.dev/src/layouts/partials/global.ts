import { html } from "common-tags";
import { ORIGIN, WORKER_ORIGIN } from "../../constants/origin";
import { PROFILE_TWITTER_URL } from "../../constants/profile";
import { getMeta } from "../../helpers/metaHelper";
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
    entryId?: string;
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
        ...(data.entryId ? { image: [`${ORIGIN}/entry/${data.entryId}`] } : {}),
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

export const render = async function (
  this: EleventyShortCode,
  {
    layout,
    title,
    content,
    publics,
    description,
    entryId,
    page,
    modified,
    renderData,
  }: EleventyProps
): Promise<string> {
  const globalScript = loadPageScript("global");
  const pageScript = loadPageScript(layout);
  const pageStyle = loadPageStyle(layout);

  const isEntry = layout === "blog/entry";

  const meta = getMeta({
    title: renderData?.title || title,
    description,
  });

  return html`<!DOCTYPE html>
    <html lang="ja">
      <head>
        <title>${meta.title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="${meta.description}" />
        <meta name="color-scheme" content="dark light" />

        <!-- === OGP meta === -->
        <meta name="og:type" content="${getOGType(layout)}" />
        <meta
          name="og:url"
          content="${isEntry ? `${ORIGIN}/entry/${entryId}` : ""}"
        />
        <meta name="og:title" content="${meta.title}" />
        <meta name="og:description" content="${meta.description}" />
        <meta
          property="og:image"
          content="${entryId
            ? `${WORKER_ORIGIN}/public/ogp/${entryId}.jpeg`
            : ""}"
        />
        <meta property="og:image:alt" content="${entryId ? title : ""}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${meta.title}" />

        <!-- Google Search Console -->
        <meta
          name="google-site-verification"
          content="-GnrzTzYxwPVlrMuDuGJSf-03pfDSp0xNCrj0mIpfwM"
        />

        <!-- === Structured data === -->
        <script type="application/ld+json">
          ${JSON.stringify(
            getJsonLD(isEntry, {
              title: meta.title,
              description: meta.description,
              publishedAt: page.date,
              modifiedAt: modified,
              entryId,
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
      </body>
    </html>`;
};
