"""Внимание мировых медиа к Украине по сферам — открытый API GDELT DOC 2.0 (все источники, запросы «<тема> Ukraine»).

Для каждой сферы: число публикаций в день и средний тон (от −10 до +10) за 12 недель.
Пишет site/data/media.json: {sphere: {"week": публикаций за 7 дней, "prev": за предыдущие 7,
"change": %, "tone": средний тон за 7 дней, "tonePrev", "series": [[дата, публикаций за неделю]]}}.
GDELT просит не чаще 1 запроса в 5 секунд — между запросами пауза 10 секунд (весь сбор ~3–4 минуты).
Запросы на английском: GDELT ищет по машинному переводу публикаций.
Обновляется не чаще раза в 3 дня.
"""
import json, sys, time, pathlib, datetime as dt, urllib.request, urllib.parse

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "site" / "data" / "media.json"
API = "https://api.gdeltproject.org/api/v2/doc/doc"
Q = {
    "energy": '(blackout OR "power outage" OR substation OR Ukrenergo OR "energy infrastructure")',
    "airdef": '("air defense" OR Patriot OR Shahed OR interceptor OR "missile attack")',
    "front": '(frontline OR "front line" OR offensive OR Kostiantynivka OR Druzhkivka OR Pokrovsk)',
    "army": '(mobilization OR conscription OR "enlistment office" OR AWOL OR desertion)',
    "economy": '(inflation OR "National Bank" OR GDP OR hryvnia OR "interest rate")',
    "finance": '(IMF OR "EU loan" OR "Ukraine Facility" OR "state budget" OR "financial aid")',
    "anticorr": '(NABU OR SAPO OR corruption OR bribery OR "anti-corruption")',
    "diplomacy": '("peace talks" OR negotiations OR "EU accession" OR "Abu Dhabi" OR "security guarantees")',
    "society": '(refugees OR KIIS OR poll OR demography OR "returning home")',
}


def get(query, mode):
    url = API + "?" + urllib.parse.urlencode({"query": f"{query} Ukraine", "mode": mode, "timespan": "12w", "format": "json"})
    for a in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "barometer/1.0 (open research)"}), timeout=90) as r:
                txt = r.read().decode("utf-8")
            d = json.loads(txt)
            return [(x["date"][:8], x["value"]) for x in d.get("timeline", [{}])[0].get("data", [])]
        except Exception:
            time.sleep(20 * (a + 1))
    return []


def main(force=False):
    if OUT.exists() and not force:
        old = json.loads(OUT.read_text(encoding="utf-8"))
        if (dt.date.today() - dt.date.fromisoformat(old["updated"])).days < 3:
            print("  media: свежие (моложе 3 дней) — пропуск")
            return old
    res = {}
    for sphere, q in Q.items():
        vol = get(q, "timelinevolraw"); time.sleep(15)
        tone = get(q, "timelinetone"); time.sleep(15)
        if not vol:
            print(f"  media {sphere}: нет данных"); continue
        v = [x[1] for x in vol]
        tv = dict(tone)
        days = [x[0] for x in vol]
        wk, pv = sum(v[-7:]), sum(v[-14:-7])
        tw = [tv[d] for d in days[-7:] if tv.get(d)]
        tp = [tv[d] for d in days[-14:-7] if tv.get(d)]
        series = [[f"{days[i][:4]}-{days[i][4:6]}-{days[i][6:8]}", sum(v[i - 6:i + 1])] for i in range(len(v) - 1, 5, -7)][::-1]
        res[sphere] = {"week": wk, "prev": pv, "change": round((wk / pv - 1) * 100, 1) if pv else None,
                       "tone": round(sum(tw) / len(tw), 2) if tw else None, "tonePrev": round(sum(tp) / len(tp), 2) if tp else None,
                       "series": series}
        print(f"  media {sphere}: {wk} публ., тон {res[sphere]['tone']}")
    out = {"updated": dt.date.today().isoformat(), "source": "GDELT DOC 2.0", "scope": "world", "spheres": res}
    if len(res) < 7:
        print(f"  media: данные только по {len(res)} сферам — не публикуем, попробуем в следующий раз")
    if len(res) >= 7:  # неполные данные не публикуем
        OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return out


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main(force="--force" in sys.argv)
