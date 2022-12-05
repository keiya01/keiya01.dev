---
layout: blog/entry
title: Mozillaへのコントリビュート方法
description: Mozillaへコントリビュートした時のメモです。
date: 2022-12-03
modified: 2022-12-02
tags:
  - contribution
  - mozilla
  - firefox
entryId: contribute-to-mozilla
---

## Overview

Mozilla へのコントリビュート方法をまとめます。
[How To Contribute Code To Firefox](https://firefox-source-docs.mozilla.org/setup/contributing_code.html)という記事にまとまっているといえばまとまっているのですがわかりにくいのでメモしておきます。

[Firefox Contributors’ Quick Reference](https://firefox-source-docs.mozilla.org/contributing/contribution_quickref.html)という記事が実際に commit などする際にわかりやすかったです。

## 諸々のサービスへ登録

まず[BugZilla](https://bugzilla.mozilla.org/)に登録します。

次に[Phabricator](https://phabricator.services.mozilla.com/)というコード管理サービスへのアクセスを許可します。

## 諸々のツールのインストール

[Mercurial](https://firefox-source-docs.mozilla.org/contributing/vcs/mercurial.html)というバージョン管理ツールを[ダウンロードページに従ってインストール](https://www.mercurial-scm.org/downloads)します。  
macOS を使用している場合は`brew`でインストールできます。

```
brew install mercurial
```

Mercurial は git のようなツールです。git と同じようにコードを commit したりできます。

コードを revision に紐づけて Phabricator へ送るために[moz-phab](https://moz-conduit.readthedocs.io/en/latest/phabricator-user.html)という便利ツールがあるのでインストールします。

[Setting up MozPhab](https://moz-conduit.readthedocs.io/en/latest/phabricator-user.html#setting-up-mozphab-1)を参考にインストールします。

## 実際にコードを送る

1. BugZilla で issue を立てます
2. コードを編集します
3. `hg commit -m "Bug <revision_id> - <commit message> r?<#group-name or nickname>"` でコミットします
4. [Group 一覧](https://firefox-source-docs.mozilla.org/contributing/reviews.html)
5. `moz-phab` 単体を実行するとコミットメッセージのチェックなどをおこなってくれます
6. `moz-phab submit <revision>` でコードを送ります

詳細は[Firefox Contributors’ Quick Reference](https://firefox-source-docs.mozilla.org/contributing/contribution_quickref.html)がわかりやすいです。
