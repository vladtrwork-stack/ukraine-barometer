"""Часы воздушных тревог по областям за 7 дней (API alerts.in.ua).

Нужен бесплатный токен: https://alerts.in.ua/api-request → переменная окружения ALERTS_TOKEN.
Без токена скрипт ничего не делает (слой карты «Часы тревог» остаётся выключенным).
Пишет site/data/alerts.json: {"updated", "regions": {id_области: часы}}.
Статус: код написан по документации API и не проверялся с реальным токеном.
"""
import json, os, sys, time, datetime as dt, urllib.request, pathlib

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "site" / "data" / "alerts.json"
API = "https://api.alerts.in.ua/v1/regions/{uid}/alerts/week_ago.json"
# uid областей alerts.in.ua → id областей «Барометра»
UIDS = {3: "khmelnytskyi", 4: "vinnytsia", 5: "rivne", 8: "volyn", 9: "dnipro", 10: "zhytomyr", 11: "zakarpattia", 12: "zaporizhzhia",
        13: "ivanofrankivsk", 14: "kyivobl", 15: "kirovohrad", 16: "luhansk", 17: "mykolaiv", 18: "odesa", 19: "poltava", 20: "sumy",
        21: "ternopil", 22: "kharkiv", 23: "kherson", 24: "cherkasy", 25: "chernihiv", 26: "chernivtsi", 27: "lviv", 28: "donetsk",
        29: "crimea", 31: "kyiv"}


def parse(ts):
    return dt.datetime.fromisoformat(ts.replace("Z", "+00:00")) if ts else None


def main():
    token = os.environ.get("ALERTS_TOKEN")
    if not token:
        print("  alerts: ALERTS_TOKEN не задан — пропуск")
        return None
    now = dt.datetime.now(dt.timezone.utc)
    since = now - dt.timedelta(days=7)
    regions = {}
    for uid, rid in UIDS.items():
        req = urllib.request.Request(API.format(uid=uid), headers={"Authorization": f"Bearer {token}", "User-Agent": "barometer/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                data = json.loads(r.read().decode("utf-8"))
        except Exception as e:
            print(f"  alerts {rid}: {e}")
            time.sleep(10)
            continue
        hours = 0.0
        for a in data.get("alerts", []):
            if a.get("alert_type") != "air_raid":
                continue
            s, f = parse(a.get("started_at")), parse(a.get("finished_at")) or now
            if not s:
                continue
            s = max(s, since)
            if f > s:
                hours += (f - s).total_seconds() / 3600
        regions[rid] = round(hours, 1)
        time.sleep(1.5)  # ограничение частоты API
    out = {"updated": dt.date.today().isoformat(), "source": "alerts.in.ua", "days": 7, "regions": regions}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"  alerts: {len(regions)} областей")
    return out


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
