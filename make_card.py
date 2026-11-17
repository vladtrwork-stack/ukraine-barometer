"""Карточка для соцсетей (1200×630) и текст поста для Telegram по последнему выпуску.

Запуск: python make_card.py [ru|uk|en]
  → site/card.png (картинка превью, og:image)
  → build/telegram_<lang>.txt (готовый текст поста)
Отправка в Telegram: python make_card.py --send  (нужны переменные окружения
TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID; без них скрипт только сохраняет текст).
SITE_URL — адрес сайта для ссылки в посте (необязательно).
"""
import json, os, sys, math, pathlib, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageFont

ROOT = pathlib.Path(__file__).parent
SITE = ROOT / "site"
FONTS = pathlib.Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts"
SHORT = {
    "ru": {"energy": "Энергетика", "airdef": "ПВО", "front": "Фронт", "army": "Армия", "economy": "Экономика", "finance": "Финансы", "anticorr": "Антикорр.", "diplomacy": "Дипломатия", "society": "Общество"},
    "uk": {"energy": "Енергетика", "airdef": "ППО", "front": "Фронт", "army": "Армія", "economy": "Економіка", "finance": "Фінанси", "anticorr": "Антикор.", "diplomacy": "Дипломатія", "society": "Суспільство"},
    "en": {"energy": "Energy", "airdef": "Air def.", "front": "Front", "army": "Manpower", "economy": "Economy", "finance": "Finance", "anticorr": "Anti-corr.", "diplomacy": "Diplomacy", "society": "Society"},
}
COL = {"crit": (232, 108, 92), "warn": (240, 178, 82), "info": (122, 164, 245), "ok": (104, 200, 142)}
TXT = {
    "ru": {"name": "Барометр Украины", "idx": "Индекс устойчивости", "issue": "Выпуск №", "main": "Главное за неделю", "more": "Полный выпуск"},
    "uk": {"name": "Барометр України", "idx": "Індекс стійкості", "issue": "Випуск №", "main": "Головне за тиждень", "more": "Повний випуск"},
    "en": {"name": "Ukraine Barometer", "idx": "Resilience index", "issue": "Issue No.", "main": "This week's key points", "more": "Full issue"},
}


LINUX = {"bold": "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", "reg": "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
         "mono": "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"}


def font(names, size):
    for n in names:
        p = FONTS / n
        if p.exists():
            return ImageFont.truetype(str(p), size)
    kind = "mono" if "consola.ttf" in names else "bold" if any("b" in n.split(".")[0][-2:] for n in names[:1]) else "reg"
    if pathlib.Path(LINUX[kind]).exists():
        return ImageFont.truetype(LINUX[kind], size)
    return ImageFont.load_default()


def score(m, auto_vals):
    v = auto_vals.get(m.get("auto")) if m.get("auto") else m.get("raw")
    if v is None:
        return None
    t = m["thresholds"]
    if m["better"] == "higher":
        return 5 if v >= t[3] else 4 if v >= t[2] else 3 if v >= t[1] else 2 if v >= t[0] else 1
    return 5 if v <= t[0] else 4 if v <= t[1] else 3 if v <= t[2] else 2 if v <= t[3] else 1


def auto_values():
    ind = json.loads((SITE / "data/indicators.json").read_text(encoding="utf-8"))
    s = ind["series"]
    def ch(pts, back):
        return (pts[-1][1] / pts[-1 - back][1] - 1) * 100 if len(pts) > back else None
    out = {"policy_rate": s["policy_rate"]["points"][-1][1], "usd_13w": ch(s["usd"]["points"], 91), "reserves_yoy": ch(s["reserves"]["points"], 12)}
    f = SITE / "data/front.json"
    if f.exists():
        p = json.loads(f.read_text(encoding="utf-8"))["points"]
        out["front_week_km2"] = p[-1]["occupied"] - p[-2]["occupied"] if len(p) > 1 else None
    pr = SITE / "data/procurement.json"
    if pr.exists():
        out["prozorro_noncomp"] = json.loads(pr.read_text(encoding="utf-8")).get("risk_noncomp_value_share")
    return out


def domain_scores(b, av):
    res = []
    for d in b["domains"]:
        sw = ss = 0
        for m in d.get("metrics", []):
            sc = score(m, av)
            if sc is not None:
                sw += m["weight"]; ss += m["weight"] * sc
        res.append((d, round(ss / sw, 1) if sw else d.get("scoreExpert", 3)))
    return res


def main(lang=None, issue=None, out=None, post=True):
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    lang = lang or (args[0] if args else "ru")
    idx = json.loads((SITE / "data/briefs/index.json").read_text(encoding="utf-8"))["briefs"]
    last = next(x for x in idx if x["id"] == issue) if issue else sorted(idx, key=lambda x: x["id"])[-1]
    b = json.loads((SITE / f"data/briefs/{last['id']}/{lang}.json").read_text(encoding="utf-8"))
    ds = domain_scores(b, auto_values())
    index = sum(s for _, s in ds) / len(ds)
    T = TXT[lang]

    # ---- картинка ----
    W, H = 1200, 630
    img = Image.new("RGB", (W, H), (13, 24, 48))
    dr = ImageDraw.Draw(img)
    for x in range(0, W, 44):
        dr.line([(x, 0), (x, H)], fill=(22, 36, 66))
    for y in range(0, H, 44):
        dr.line([(0, y), (W, y)], fill=(22, 36, 66))
    bold = ["seguisb.ttf", "segoeuib.ttf", "arialbd.ttf"]
    reg = ["segoeui.ttf", "arial.ttf"]
    mono = ["consola.ttf", "cour.ttf"]
    dr.rounded_rectangle([60, 56, 84, 80], 5, fill=(31, 86, 179)); dr.rectangle([60, 68, 84, 80], fill=(201, 154, 28))
    dr.text((98, 52), T["name"], font=font(bold, 30), fill=(238, 243, 251))
    dr.text((60, 108), f"{T['issue']} {b['number']} · {b['period']}".upper(), font=font(mono, 20), fill=(159, 176, 207))
    dr.text((60, 170), T["idx"], font=font(reg, 30), fill=(159, 176, 207))
    num = f"{index:.1f}".replace(".", "," if lang != "en" else ".")
    dr.text((56, 205), num, font=font(bold, 150), fill=(238, 243, 251))
    w = dr.textlength(num, font=font(bold, 150))
    dr.text((66 + w, 300), "/ 5", font=font(reg, 46), fill=(159, 176, 207))
    # полоса сфер
    x0, y0, bw = 60, 470, (W - 120 - 8 * 8) / 9
    for i, (d, s) in enumerate(sorted(ds, key=lambda z: z[1])):
        x = x0 + i * (bw + 8)
        dr.rounded_rectangle([x, y0, x + bw, y0 + 12], 4, fill=COL.get(d["status"], (150, 150, 150)))
        name = SHORT[lang].get(d["id"], d["name"])
        dr.text((x, y0 + 22), name, font=font(reg, 17), fill=(200, 212, 232))
        dr.text((x, y0 + 46), f"{s:.1f}", font=font(mono, 18), fill=(238, 243, 251))
    # главное
    hx = 560
    dr.text((hx, 175), T["main"], font=font(bold, 26), fill=(201, 154, 28))
    y = 220
    for h in b["headline"][:3]:
        words, line, lines = h["title"].split(), "", []
        for wd in words:
            if dr.textlength(line + " " + wd, font=font(reg, 24)) > W - hx - 80:
                lines.append(line); line = wd
            else:
                line = (line + " " + wd).strip()
        lines.append(line)
        dr.ellipse([hx, y + 9, hx + 12, y + 21], fill=COL.get(h["level"], (200, 200, 200)))
        for ln in lines[:2]:
            dr.text((hx + 26, y), ln, font=font(reg, 24), fill=(238, 243, 251)); y += 32
        y += 14
    img.save(out or (SITE / "card.png"), optimize=True)
    if not post:
        return

    # ---- текст для Telegram ----
    url = os.environ.get("SITE_URL", "")
    dot = {"crit": "🔴", "warn": "🟠", "info": "🔵", "ok": "🟢"}
    text = "\n".join([f"<b>{T['name']} · {T['issue']} {b['number']}</b>", b["period"], "",
                      f"{T['idx']}: <b>{num} / 5</b>", "",
                      *[f"{dot.get(h['level'], '•')} <b>{h['title']}</b>" for h in b["headline"]],
                      "", f"{T['more']}: {url}" if url else ""]).strip()
    out = ROOT / "build" / f"telegram_{lang}.txt"
    out.parent.mkdir(exist_ok=True)
    out.write_text(text, encoding="utf-8")
    print(f"card: {SITE / 'card.png'}\ntelegram: {out}")

    if "--send" in sys.argv:
        tok, chat = os.environ.get("TELEGRAM_BOT_TOKEN"), os.environ.get("TELEGRAM_CHAT_ID")
        if not (tok and chat):
            print("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID не заданы — пост не отправлен.")
            return
        data = urllib.parse.urlencode({"chat_id": chat, "text": text, "parse_mode": "HTML", "disable_web_page_preview": "false"}).encode()
        with urllib.request.urlopen(f"https://api.telegram.org/bot{tok}/sendMessage", data=data, timeout=30) as r:
            print("telegram:", r.status)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    if "--all-issues" in sys.argv:
        (SITE / "cards").mkdir(exist_ok=True)
        for it in json.loads((SITE / "data/briefs/index.json").read_text(encoding="utf-8"))["briefs"]:
            for lg in ("ru", "uk", "en"):
                main(lg, it["id"], SITE / "cards" / f"{it['id']}-{lg}.png", post=False)
        print("cards: ok")
    else:
        main()
