"""Сборка производных файлов сайта и проверка данных.

  python build_site.py          — проверка + export CSV + RSS-ленты + sitemap
  python build_site.py --check  — только проверка (код выхода 1 при ошибке)

Пишет: site/data/export/barometer.csv, site/feed.xml, site/feed-uk.xml, site/feed-en.xml, site/sitemap.xml
"""
import json, sys, csv, pathlib, datetime as dt, html, re
from email.utils import format_datetime

ROOT = pathlib.Path(__file__).parent
SITE = ROOT / "site"
DATA = SITE / "data"
LANGS = ("ru", "uk", "en")
DOMAINS = ["energy", "airdef", "front", "army", "economy", "finance", "anticorr", "diplomacy", "society"]
SAME_KEYS = ["id", "status", "score", "trend", "thresholds", "weight", "better", "conf", "auto", "level", "dir", "due", "url", "uah", "risk", "impact"]
NAME = {"ru": "Барометр Украины", "uk": "Барометр України", "en": "Ukraine Barometer"}


def load(p):
    return json.loads(p.read_text(encoding="utf-8"))


def walk_same(a, b, path, errs):
    """Проверяет, что «служебные» поля совпадают во всех языках."""
    if isinstance(a, dict) and isinstance(b, dict):
        for k in a:
            if k in SAME_KEYS and k in b and a[k] != b[k] and not isinstance(a[k], str) or (k in ("id", "status", "level", "dir", "due", "url", "auto", "better", "conf") and k in b and a[k] != b[k]):
                errs.append(f"{path}.{k}: {a[k]!r} ≠ {b.get(k)!r}")
            if k in b:
                walk_same(a[k], b[k], f"{path}.{k}", errs)
    elif isinstance(a, list) and isinstance(b, list):
        if len(a) != len(b):
            errs.append(f"{path}: длина {len(a)} ≠ {len(b)}")
        for i, (x, y) in enumerate(zip(a, b)):
            walk_same(x, y, f"{path}[{i}]", errs)


def check():
    errs = []
    idx = load(DATA / "briefs/index.json")["briefs"]
    for it in idx:
        bs = {}
        for lang in LANGS:
            f = DATA / f"briefs/{it['id']}/{lang}.json"
            if not f.exists():
                errs.append(f"нет файла {f}")
                continue
            b = bs[lang] = load(f)
            ids = [d["id"] for d in b.get("domains", [])]
            if sorted(ids) != sorted(DOMAINS):
                errs.append(f"{f.name} {it['id']}: сферы {ids}")
            for d in b.get("domains", []):
                for r in d.get("recs", []):
                    if not r.get("effect"):
                        errs.append(f"{it['id']}/{lang} {d['id']}: предложение без effect")
                    for k in (r.get("impact") or {}):
                        if k not in DOMAINS:
                            errs.append(f"{it['id']}/{lang} {d['id']}: impact на неизвестную сферу {k}")
                ws = sum(m["weight"] for m in d.get("metrics", []))
                if d.get("metrics") and abs(ws - 1) > 0.02:
                    errs.append(f"{it['id']}/{lang} {d['id']}: сумма весов {ws:.2f}")
                for m in d.get("metrics", []):
                    if len(m.get("thresholds", [])) != 4:
                        errs.append(f"{it['id']}/{lang} {d['id']}: у метрики не 4 порога")
            if b.get("id") != it["id"]:
                errs.append(f"{f}: id {b.get('id')} ≠ {it['id']}")
        if "ru" in bs:
            for lang in ("uk", "en"):
                if lang in bs:
                    walk_same(bs["ru"], bs[lang], f"{it['id']}/{lang}", errs)
    return errs


def scores(b, auto):
    out = {}
    for d in b["domains"]:
        sw = ss = 0
        for m in d.get("metrics", []):
            v = auto.get(m["auto"]) if m.get("auto") else m.get("raw")
            if v is None:
                continue
            t = m["thresholds"]
            sc = (5 if v >= t[3] else 4 if v >= t[2] else 3 if v >= t[1] else 2 if v >= t[0] else 1) if m["better"] == "higher" else \
                 (5 if v <= t[0] else 4 if v <= t[1] else 3 if v <= t[2] else 2 if v <= t[3] else 1)
            sw += m["weight"]; ss += m["weight"] * sc
        out[d["id"]] = round(ss / sw, 2) if sw else d.get("scoreExpert", 3)
    return out


def auto_values(date):
    ind = load(DATA / "indicators.json")["series"]
    def at(pts, iso):
        f = None
        for p in pts:
            if p[0] <= iso:
                f = p
        return f
    def back(iso, days):
        return (dt.date.fromisoformat(iso) - dt.timedelta(days=days)).isoformat()
    def ch(key, days):
        a, b = at(ind[key]["points"], date), at(ind[key]["points"], back(date, days))
        return (a[1] / b[1] - 1) * 100 if a and b else None
    out = {"policy_rate": (at(ind["policy_rate"]["points"], date) or [None, None])[1], "usd_13w": ch("usd", 91), "reserves_yoy": ch("reserves", 365)}
    fr = DATA / "front.json"
    if fr.exists():
        pts = [p for p in load(fr)["points"] if p["date"] <= date]
        out["front_week_km2"] = pts[-1]["occupied"] - pts[-2]["occupied"] if len(pts) > 1 else None
    pr = DATA / "procurement.json"
    if pr.exists():
        p = load(pr)
        if abs((dt.date.fromisoformat(p["updated"]) - dt.date.fromisoformat(date)).days) <= 4:
            out["prozorro_noncomp"] = p.get("risk_noncomp_value_share")
    return out


UI = {
    "ru": {"idx": "Индекс устойчивости", "open": "Открыть полный выпуск", "issue": "Выпуск №", "main": "Главное за неделю", "areas": "Сферы"},
    "uk": {"idx": "Індекс стійкості", "open": "Відкрити повний випуск", "issue": "Випуск №", "main": "Головне за тиждень", "areas": "Сфери"},
    "en": {"idx": "Resilience index", "open": "Open the full issue", "issue": "Issue No.", "main": "This week's key points", "areas": "Areas"},
}
COLORS = {"crit": "#ff5f5f", "warn": "#ffb340", "info": "#5b9cff", "ok": "#34d399"}


def issue_page(b, lang, ix, sc, base):
    T, e = UI[lang], html.escape
    num = f"{ix:.1f}" if lang == "en" else f"{ix:.1f}".replace(".", ",")
    title = f"{NAME[lang]} · {T['issue']} {b['number']}: {num}/5"
    desc = " · ".join(h["title"] for h in b["headline"][:3])
    img = f"{base}/cards/{b['id']}-{lang}.png" if base else f"../../cards/{b['id']}-{lang}.png"
    app = f"../../?week={b['id']}&lang={lang}"
    rows = "".join(f"<li><span style='background:{COLORS.get(d['status'], '#999')}'></span>{e(d['name'])}<b>{sc[d['id']]:.1f}</b></li>"
                   for d in sorted(b["domains"], key=lambda d: sc[d["id"]]))
    heads = "".join(f"<li><b>{e(h['title'])}</b><p>{e(h['text'])}</p></li>" for h in b["headline"])
    alt = "".join(f'<link rel="alternate" hreflang="{l}" href="{base}/issues/{b["id"]}/{"" if l == "ru" else l + ".html"}">' for l in LANGS) if base else ""
    return f"""<!doctype html><html lang="{lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{e(title)}</title><meta name="description" content="{e(desc)}">
<meta property="og:title" content="{e(title)}"><meta property="og:description" content="{e(desc)}"><meta property="og:type" content="article">
<meta property="og:image" content="{img}"><meta name="twitter:card" content="summary_large_image">{alt}
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600&family=Onest:wght@400;500;600&display=swap">
<style>:root{{--bg:#06080d;--card:#0d121c;--ink:#eaf0fa;--muted:#93a0b6;--line:rgba(148,170,210,.14);--accent:#5b9cff;color-scheme:dark}}
@media (prefers-color-scheme:light){{:root{{--bg:#f3f5fa;--card:#fff;--ink:#0d1526;--muted:#56627a;--line:rgba(20,34,64,.1);--accent:#2563eb;color-scheme:light}}}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--ink);font:16px/1.55 Onest,system-ui,sans-serif}}
main{{max-width:860px;margin:0 auto;padding:32px max(16px,env(safe-area-inset-left)) 64px;display:grid;gap:22px}}
.k{{font:600 12px/1 Onest;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}}h1{{font:600 clamp(28px,5vw,44px)/1.05 Unbounded,sans-serif;letter-spacing:-.03em;margin:0}}
.ix{{font:600 64px/1 Unbounded,sans-serif;letter-spacing:-.04em}}.ix small{{font-size:20px;color:var(--muted)}}
.c{{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:22px 24px}}ul{{list-style:none;margin:0;padding:0;display:grid;gap:10px}}
.a li{{display:grid;grid-template-columns:10px 1fr auto;gap:10px;align-items:center}}.a span{{width:10px;height:10px;border-radius:50%}}
.h p{{margin:2px 0 0;color:var(--muted)}}a.b{{justify-self:start;background:var(--accent);color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600}}</style></head>
<body><main><span class="k">{e(NAME[lang])} · {T['issue']} {b['number']} · {e(b['period'])}</span><h1>{e(T['main'])}</h1>
<div class="c"><span class="k">{e(T['idx'])}</span><div class="ix">{num}<small> / 5</small></div></div>
<div class="c h"><ul>{heads}</ul></div><div class="c a"><span class="k">{e(T['areas'])}</span><ul style="margin-top:12px">{rows}</ul></div>
<a class="b" href="{app}">{e(T['open'])} →</a></main></body></html>"""


def bust_cache():
    """Версия файлов по содержимому: style.css?v=…, app.js?v=… — браузер сразу берёт новую версию."""
    import hashlib
    page = SITE / "index.html"
    s = page.read_text(encoding="utf-8")
    for name in ("style.css", "app.js"):
        v = hashlib.sha1((SITE / name).read_bytes()).hexdigest()[:8]
        s = re.sub(rf'{re.escape(name)}(\?v=[0-9a-f]+)?"', f'{name}?v={v}"', s)
    page.write_text(s, encoding="utf-8")


def build():
    idx = sorted(load(DATA / "briefs/index.json")["briefs"], key=lambda x: x["id"])
    (DATA / "export").mkdir(exist_ok=True)
    rows = []
    hist = DATA / "history.json"
    if hist.exists():
        for p in load(hist)["points"]:
            rows.append({"date": p["date"], "issue": "", "type": "reconstruction", **p["domains"],
                         "index": round(sum(p["domains"].values()) / len(p["domains"]), 2)})
    briefs = {}
    for it in idx:
        b = briefs[it["id"]] = {lang: load(DATA / f"briefs/{it['id']}/{lang}.json") for lang in LANGS}
        sc = scores(b["ru"], auto_values(b["ru"]["compiled"]))
        rows.append({"date": b["ru"]["compiled"], "issue": it["number"], "type": "issue", **sc, "index": round(sum(sc.values()) / len(sc), 2)})
    with open(DATA / "export/barometer.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=["date", "issue", "type", *DOMAINS, "index"])
        w.writeheader(); w.writerows(rows)

    # Сводка последнего выпуска — для виджета embed.html и внешних потребителей
    last = briefs[idx[-1]["id"]]
    sc = scores(last["ru"], auto_values(last["ru"]["compiled"]))
    latest = {"id": last["ru"]["id"], "number": last["ru"]["number"], "compiled": last["ru"]["compiled"],
              "index": round(sum(sc.values()) / len(sc), 2), "period": {l: last[l]["period"] for l in LANGS},
              "domains": {d["id"]: {"score": sc[d["id"]], "status": d["status"], "name": {l: next(x["name"] for x in last[l]["domains"] if x["id"] == d["id"]) for l in LANGS}}
                          for d in last["ru"]["domains"]}}
    (DATA / "latest.json").write_text(json.dumps(latest, ensure_ascii=False, indent=1), encoding="utf-8")

    cfg = load(SITE / "config.json") if (SITE / "config.json").exists() else {}
    base = (cfg.get("siteUrl") or "").rstrip("/")
    for lang in LANGS:
        items = []
        for it in reversed(idx):
            b = briefs[it["id"]][lang]
            sc = scores(b, auto_values(b["compiled"]))
            ix = sum(sc.values()) / len(sc)
            pub = format_datetime(dt.datetime.fromisoformat(b["compiled"] + "T10:00:00+00:00"))
            desc = "".join(f"<p><b>{html.escape(h['title'])}</b> — {html.escape(h['text'])}</p>" for h in b["headline"])
            title = f"{NAME[lang]} № {b['number']}: {ix:.1f}/5 · {b['period']}"
            items.append(f"<item><title>{html.escape(title)}</title><link>{base}/#overview</link><guid isPermaLink=\"false\">barometer-{b['id']}-{lang}</guid>"
                         f"<pubDate>{pub}</pubDate><description>{html.escape(desc)}</description></item>")
        feed = (f"<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\"><channel><title>{NAME[lang]}</title>"
                f"<link>{base or '.'}/</link><description>{NAME[lang]}</description><language>{lang}</language>{''.join(items)}</channel></rss>")
        (SITE / ("feed.xml" if lang == "ru" else f"feed-{lang}.xml")).write_text(feed, encoding="utf-8")
    # Статические страницы выпусков (для ссылок и превью в соцсетях)
    issue_urls = []
    for it in idx:
        for lang in LANGS:
            bb = briefs[it["id"]][lang]
            sc = scores(bb, auto_values(bb["compiled"]))
            ix = sum(sc.values()) / len(sc)
            d = SITE / "issues" / it["id"]
            d.mkdir(parents=True, exist_ok=True)
            fn = "index.html" if lang == "ru" else f"{lang}.html"
            issue_urls.append(f"{base}/issues/{it['id']}/{'' if lang == 'ru' else fn}")
            (d / fn).write_text(issue_page(bb, lang, ix, sc, base), encoding="utf-8")
    if base:
        (SITE / "sitemap.xml").write_text(f"<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"><url><loc>{base}/</loc><lastmod>{idx[-1]['id']}</lastmod></url>" + "".join(f"<url><loc>{u}</loc></url>" for u in issue_urls) + "</urlset>", encoding="utf-8")
    bust_cache()
    print(f"export: {len(rows)} строк; RSS ×3")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    errs = check()
    if errs:
        print("ОШИБКИ ДАННЫХ:", *errs[:40], sep="\n  ")
        sys.exit(1)
    print("проверка: ок")
    if "--check" not in sys.argv:
        build()
