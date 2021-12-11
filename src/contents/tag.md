---
eleventyExcludeFromCollections: true
layout: blog/entries
pagination:
  data: collections
  size: 1
  alias: tag
permalink: /{{ tag }}/
renderData:
  title: "{{ tag }} タグ一覧"
---
