#!/usr/bin/env python3
"""リポジトリ直下の *_ja.html / *_en.html から sitemap.xml を自動生成する。

- <lastmod> は各ファイルの最後のコミット日(git log)を使う
- 日本語版/英語版が揃っているページには hreflang(ja / en / x-default)を付ける
- ヘッダー・フッター等の部品HTMLは EXCLUDE_BASES で除外する
"""
import os
import subprocess
import sys
import datetime

BASE = os.environ.get("SITE_BASE_URL", "").strip()
if not BASE:
    sys.exit("環境変数 SITE_BASE_URL が未設定です (例: https://example.com/)")
if not BASE.endswith("/"):
    BASE += "/"

EXCLUDE = {b.strip() for b in os.environ.get("EXCLUDE_BASES", "header,footer").split(",") if b.strip()}
TODAY = datetime.date.today().isoformat()


def last_commit_date(path):
    """そのファイルの最終コミット日 (YYYY-MM-DD)。取得できなければ今日の日付。"""
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", path],
            capture_output=True, text=True, check=True,
        ).stdout.strip()
        return out or TODAY
    except Exception:
        return TODAY


def main():
    bases = sorted({
        f[:-8] for f in os.listdir(".")
        if f.endswith(("_ja.html", "_en.html")) and f[:-8] not in EXCLUDE
    })
    if not bases:
        sys.exit("対象ページが見つかりませんでした")

    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
        '',
    ]
    total = 0
    for base in bases:
        present = [lang for lang in ("ja", "en") if os.path.exists(f"{base}_{lang}.html")]
        urls = {lang: f"{BASE}{base}_{lang}.html" for lang in present}
        alts = []
        if len(present) > 1:                      # 両言語そろっている場合のみ hreflang を出す
            for lang in present:
                alts.append(f'    <xhtml:link rel="alternate" hreflang="{lang}" href="{urls[lang]}"/>')
            xdefault = urls.get("ja", urls[present[0]])
            alts.append(f'    <xhtml:link rel="alternate" hreflang="x-default" href="{xdefault}"/>')

        for lang in present:
            lastmod = last_commit_date(f"{base}_{lang}.html")
            lines += ['  <url>', f'    <loc>{urls[lang]}</loc>'] + alts + \
                     [f'    <lastmod>{lastmod}</lastmod>', '  </url>']
            total += 1
        lines.append('')
    lines.append('</urlset>')

    with open("sitemap.xml", "w", encoding="utf-8", newline="\n") as fp:
        fp.write("\n".join(lines) + "\n")
    print(f"sitemap.xml を生成しました: {total} URL / {len(bases)} ページ系統")


if __name__ == "__main__":
    main()