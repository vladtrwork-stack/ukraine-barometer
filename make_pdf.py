"""PDF-отчёты выпусков: печать страниц site/issues/<id>/{index,uk,en}.html через headless Chrome/Edge.

Пишет site/issues/<id>/barometer-<id>-<lang>.pdf. Пропускает уже готовые PDF, если страница не новее.
В GitHub Actions используется google-chrome (есть на ubuntu-latest).
"""
import os, sys, shutil, pathlib, subprocess

ROOT = pathlib.Path(__file__).parent
SITE = ROOT / "site"
CANDIDATES = ["google-chrome", "chromium", "chromium-browser",
              r"C:\Program Files\Google\Chrome\Application\chrome.exe",
              r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
              r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"]


def browser():
    for c in CANDIDATES:
        p = shutil.which(c) or (c if os.path.exists(c) else None)
        if p:
            return p
    return None


def main():
    b = browser()
    if not b:
        print("pdf: браузер не найден — пропуск")
        return
    made = 0
    for d in sorted((SITE / "issues").glob("*")):
        for lang, page in (("ru", "index.html"), ("uk", "uk.html"), ("en", "en.html")):
            src = d / page
            if not src.exists():
                continue
            out = d / f"barometer-{d.name}-{lang}.pdf"
            if out.exists() and out.stat().st_mtime >= src.stat().st_mtime:
                continue
            subprocess.run([b, "--headless=new", "--disable-gpu", "--no-sandbox", "--no-pdf-header-footer",
                            "--virtual-time-budget=8000", f"--print-to-pdf={out}", src.resolve().as_uri()],
                           check=False, capture_output=True, timeout=120)
            if out.exists():
                made += 1
    print(f"pdf: создано {made}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
