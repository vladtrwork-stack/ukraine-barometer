"""Готовит версию дашборда для публикации как Claude Artifact.

Артефакт сам оборачивает страницу в <!doctype>/<html>/<body>, поэтому
из site/index.html вырезаются эти теги. Остальные файлы (style.css, app.js,
data/*.json) публикуются рядом без изменений.
Запуск: python build_artifact.py  →  build/artifact.html
"""
import re, pathlib

ROOT = pathlib.Path(__file__).parent
src = (ROOT / "site" / "index.html").read_text(encoding="utf-8")
head = re.search(r"<head>(.*?)</head>", src, re.S).group(1)
body = re.search(r"<body>(.*?)</body>", src, re.S).group(1)
head = "\n".join(l for l in head.splitlines() if "charset" not in l and 'name="viewport"' not in l)
# CSP артефакта: свои CSS и JS встраиваются в страницу, JSON грузится fetch'ем рядом
css = (ROOT / "site" / "style.css").read_text(encoding="utf-8")
js = (ROOT / "site" / "app.js").read_text(encoding="utf-8")
head = head.replace('<link rel="stylesheet" href="style.css">', f"<style>\n{css}</style>")
body = body.replace('<script src="app.js"></script>', f"<script>\n{js}</script>")
out = ROOT / "build" / "artifact.html"
out.parent.mkdir(exist_ok=True)
out.write_text(head.strip() + "\n" + body.strip() + "\n", encoding="utf-8")
print(out)
