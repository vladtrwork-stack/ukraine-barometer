"""Закупки из открытых API Prozorro.

1. Темы риска (поиск prozorro.gov.ua, 30 дней): количество, сумма, доля без конкуренции по сумме,
   крупнейшие неконкурентные закупки.
2. Регионы (лента public.api.openprocurement.org, 7 дней): число обновлённых закупок и доля без конкуренции.

Пишет site/data/procurement.json. Контактные данные заказчиков не сохраняются.
Закупка без конкуренции — сигнал для проверки, а не доказательство нарушения.
Значительная часть оборонных закупок в Prozorro не публикуется — это ограничение метода.
"""
import json, sys, time, datetime as dt, urllib.request, urllib.parse, pathlib, collections

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "site" / "data" / "procurement.json"
SEARCH = "https://prozorro.gov.ua/api/search/tenders"
FEED = ("https://public.api.openprocurement.org/api/2.5/tenders?descending=1&limit=1000"
        "&opt_fields=procurementMethodType,procuringEntity,status")
UA = {"User-Agent": "shtab-dashboard/1.0 (open-data research)"}
NONCOMP = ["reporting", "negotiation", "negotiation.quick"]
SENSITIVE = {"energy_protection", "fortification"}
TOPICS = {
    "energy_protection": "захист підстанції",
    "drones": "БпЛА",
    "fortification": "фортифікаційні споруди",
    "generators": "генератор",
    "shelters": "укриття",
}


def http(url, data=None):
    for attempt in range(7):
        try:
            body = urllib.parse.urlencode(data, doseq=True).encode() if data else None
            hdr = dict(UA, **({"Content-Type": "application/x-www-form-urlencoded"} if data else {}))
            with urllib.request.urlopen(urllib.request.Request(url, data=body, headers=hdr), timeout=90) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception:
            if attempt == 6:
                raise
            time.sleep(8 * (attempt + 1))


def search_all(text, start, proc_types=None, max_pages=15):
    rows, page = [], 1
    while page <= max_pages:
        q = {"text": text, "page": page, "date[created][start]": start, "per_page": 100}
        if proc_types:
            q["proc_type[]"] = proc_types
        d = http(SEARCH, q)
        got = d.get("data", [])
        rows += [x for x in got if (x.get("tenderID") or "UA-0000-00-00")[3:13] >= start]
        if page * d.get("per_page", 20) >= d.get("total", 0):
            return rows, d.get("total", 0)
        page += 1
        time.sleep(1.2)
    return rows, None


def uah(x):
    v = x.get("value") or {}
    return float(v.get("amount") or 0) if v.get("currency", "UAH") == "UAH" else 0.0


def topics_part(days=30):
    start = (dt.date.today() - dt.timedelta(days=days)).isoformat()
    out = {}
    for key, text in TOPICS.items():
        allr, total = search_all(text, start)
        nc, nc_total = search_all(text, start, NONCOMP)
        allr = [x for x in allr if x.get("status") not in ("cancelled", "unsuccessful")]
        nc = [x for x in nc if x.get("status") not in ("cancelled", "unsuccessful")]
        val, ncval = sum(map(uah, allr)), sum(map(uah, nc))
        # Безопасность: для защиты энергообъектов и фортификаций — только агрегаты, без названий объектов
        top = [] if key in SENSITIVE else sorted(nc, key=lambda x: -uah(x))[:5]
        out[key] = {"query": text, "count": len(allr), "value": round(val), "noncomp": len(nc), "noncomp_value": round(ncval),
                    "truncated": total is None or nc_total is None,
                    "top": [{"title": (x.get("title") or "")[:160], "buyer": ((x.get("procuringEntity") or {}).get("identifier") or {}).get("legalName", "")[:120],
                             "region": "", "value": round(uah(x)), "id": x.get("tenderID")} for x in top]}
        print(f"    {key}: {len(allr)} шт, {val:,.0f} грн, без конкуренции {len(nc)} шт / {ncval:,.0f} грн")
    return out


def regions_part(days=7):
    since = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=days)).isoformat()
    url, seen, pages = FEED, set(), 0
    regions = collections.defaultdict(lambda: {"total": 0, "noncomp": 0})
    while True:
        d = http(url); pages += 1
        rows = d.get("data", [])
        if not rows:
            break
        stop = False
        for x in rows:
            if x["dateModified"] < since:
                stop = True; break
            if x["id"] in seen or x.get("status") in ("cancelled", "unsuccessful", "draft"):
                continue
            seen.add(x["id"])
            reg = ((x.get("procuringEntity") or {}).get("address") or {}).get("region") or "—"
            regions[reg]["total"] += 1
            if x.get("procurementMethodType") in NONCOMP:
                regions[reg]["noncomp"] += 1
        if stop:
            break
        url = d["next_page"]["uri"]
        if pages % 25 == 0:
            print(f"    лента: {pages} стр., {len(seen)} закупок")
    return dict(regions), len(seen)


def main():
    print("  Prozorro: темы риска (30 дней)…")
    topics = topics_part()
    tv = sum(t["value"] for t in topics.values())
    tnv = sum(t["noncomp_value"] for t in topics.values())
    print("  Prozorro: регионы (7 дней)…")
    regions, total = regions_part()
    out = {"updated": dt.date.today().isoformat(), "source": "Prozorro", "url": "https://prozorro.gov.ua",
           "topicsDays": 30, "regionsDays": 7, "total": total,
           "noncomp_share": round(sum(r["noncomp"] for r in regions.values()) / max(1, total) * 100, 1),
           "risk_noncomp_value_share": round(tnv / tv * 100, 1) if tv else None,
           "topics": topics, "regions": regions}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"  Prozorro: регионы {total} закупок, без конкуренции {out['noncomp_share']}% (по числу); "
          f"темы риска без конкуренции {out['risk_noncomp_value_share']}% (по сумме)")
    return out


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
