"""Аналитический штаб: сборщик числовых показателей из открытых API.

Запуск:  python collect.py
Пишет:   site/data/indicators.json   — ряды для графиков дашборда
         data/snapshot_YYYY-MM-DD.json — архив сырого снимка
Цифры считает код; LLM потом только интерпретирует их.
"""
import json, sys, datetime as dt, urllib.request, pathlib

NBU = "https://bank.gov.ua/NBUStatService/v1/statdirectory/"
NBU_FX = "https://bank.gov.ua/NBU_Exchange/exchange_site"
ROOT = pathlib.Path(__file__).parent
SITE_DATA = ROOT / "site" / "data"
ARCHIVE = ROOT / "data"
TODAY = dt.date.today()


def get(url, timeout=60):
    with urllib.request.urlopen(url, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8"))


def fx_daily(code, days=365):
    start = TODAY - dt.timedelta(days=days)
    url = (f"{NBU_FX}?start={start:%Y%m%d}&end={TODAY:%Y%m%d}"
           f"&valcode={code.lower()}&sort=exchangedate&order=asc&json")
    rows = get(url)
    out = []
    for r in rows:
        d = dt.datetime.strptime(r["exchangedate"], "%d.%m.%Y").date()
        out.append([d.isoformat(), round(r["rate_per_unit"], 4)])
    return out


def nbu_series(endpoint, id_api, since):
    rows = get(f"{NBU}{endpoint}?json")
    pts = []
    for r in rows:
        if r.get("id_api") == id_api and r["dt"] >= since:
            d = dt.datetime.strptime(r["dt"], "%Y%m%d").date().isoformat()
            pts.append([d, r["value"]])
    return sorted(pts)


def step_changes(pts):
    """Дневной ряд ставки → только точки, где значение менялось (+ последняя)."""
    out = []
    for d, v in pts:
        if not out or out[-1][1] != v:
            out.append([d, v])
    if pts and out[-1][0] != pts[-1][0]:
        out.append(pts[-1])
    return out


def change(series, back):
    """Изменение в % между последней точкой и точкой `back` шагов назад."""
    if len(series) <= back:
        return None
    a, b = series[-1][1], series[-1 - back][1]
    return round((a / b - 1) * 100, 2) if b else None


def main():
    SITE_DATA.mkdir(parents=True, exist_ok=True)
    ARCHIVE.mkdir(exist_ok=True)
    out = {"updated": TODAY.isoformat(), "series": {}, "errors": []}

    def add(key, title, unit, source, freq, fn, transform=None):
        try:
            pts = fn()
            if transform:
                pts = transform(pts)
            out["series"][key] = {"title": title, "unit": unit, "source": source,
                                  "freq": freq, "points": pts}
            print(f"  ok  {key}: {len(pts)} точек, последняя {pts[-1] if pts else '—'}")
        except Exception as e:
            out["errors"].append(f"{key}: {e}")
            print(f"  ERR {key}: {e}")

    since2y = (TODAY - dt.timedelta(days=730)).strftime("%Y%m%d")
    since3y = (TODAY - dt.timedelta(days=1100)).strftime("%Y%m%d")

    add("usd", "Курс USD/UAH", "грн", "НБУ", "D", lambda: fx_daily("USD"))
    add("eur", "Курс EUR/UAH", "грн", "НБУ", "D", lambda: fx_daily("EUR"))
    add("pln", "Курс PLN/UAH", "грн", "НБУ", "D", lambda: fx_daily("PLN"))
    add("reserves", "Международные резервы", "млрд $", "НБУ", "M",
        lambda: [[d, round(v / 1000, 2)] for d, v in nbu_series("res", "RES_OffReserveAssets", since3y)])
    add("policy_rate", "Учётная ставка НБУ", "%", "НБУ", "D",
        lambda: nbu_series("key", "KEY_PolicyRate", since2y), step_changes)

    # Краткие производные метрики для KPI-плиток
    s = out["series"]
    out["derived"] = {
        "usd_wow": change(s.get("usd", {}).get("points", []), 5),   # ~неделя рабочих дней
        "usd_qoq": change(s.get("usd", {}).get("points", []), 63),
        "eur_wow": change(s.get("eur", {}).get("points", []), 5),
        "eur_qoq": change(s.get("eur", {}).get("points", []), 63),
        "reserves_yoy": change(s.get("reserves", {}).get("points", []), 12),
    }

    # Если НБУ недоступен целиком (например, закрыта сеть) — файл не трогаем, чтобы не выдать старое за свежее
    if len(out["errors"]) >= 5:
        print("Все источники НБУ недоступны — indicators.json не изменён")
        return
    # Если недоступна часть рядов — сохраняем их прошлые значения, а не пишем пустые
    prev_f = SITE_DATA / "indicators.json"
    if prev_f.exists():
        prev = json.loads(prev_f.read_text(encoding="utf-8")).get("series", {})
        for k, v in prev.items():
            if k not in out["series"] or not out["series"][k].get("points"):
                out["series"][k] = v

    (SITE_DATA / "indicators.json").write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (ARCHIVE / f"snapshot_{TODAY:%Y-%m-%d}.json").write_text(
        json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("Производные:", out["derived"])
    if out["errors"]:
        print("Ошибки:", *out["errors"], sep="\n  ")

    if "--nbu-only" in sys.argv:
        return
    # Дополнительные автоисточники (каждый пишет свой файл в site/data)
    import collect_front, collect_prozorro, collect_alerts, collect_lights, collect_media
    for name, mod in [("DeepState", collect_front), ("Prozorro", collect_prozorro), ("Тревоги", collect_alerts),
                      ("Ночная яркость NASA", collect_lights), ("Медиа GDELT", collect_media)]:
        try:
            print(f"{name}…")
            mod.main()
        except Exception as e:
            print(f"  ERR {name}: {e}")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
