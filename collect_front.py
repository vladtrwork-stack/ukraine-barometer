"""Площадь оккупированной и «серой» территории по открытой карте DeepState.

Пишет site/data/front.json: недельные точки за ~12 недель, км².
Считается только то, что DeepState уже публикует открыто; никаких новых данных о позициях.
"""
import json, math, sys, datetime as dt, urllib.request, pathlib

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "site" / "data" / "front.json"
API = "https://deepstatemap.live/api/history"
UA = {"User-Agent": "shtab-dashboard/1.0 (open-data research)"}
R = 6371.0088  # км


def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
        return json.loads(r.read().decode("utf-8"))


def ring_area(coords):
    """Площадь кольца на сфере, км² (формула Чемберлена — Дюкетта)."""
    if len(coords) < 3:
        return 0.0
    s = 0.0
    for i in range(len(coords)):
        lon1, lat1 = coords[i][:2]
        lon2, lat2 = coords[(i + 1) % len(coords)][:2]
        s += math.radians(lon2 - lon1) * (2 + math.sin(math.radians(lat1)) + math.sin(math.radians(lat2)))
    return abs(s) * R * R / 2


def poly_area(rings):
    return max(0.0, ring_area(rings[0]) - sum(ring_area(h) for h in rings[1:]))


def classify(name):
    n = (name or "").lower()
    if "territories" in n or "придністров" in n or "цхінвал" in n or "абхаз" in n:
        return None  # не Украина
    if "status.occupied" in n or "окуповано" in n:
        return "occupied"
    if "status.unknown" in n or "невідомий" in n:
        return "unknown"
    if "status.dismissed" in n or "звільнено" in n:
        return "liberated"
    return None


def areas(gid):
    g = get(f"{API}/{gid}/geojson")
    acc = {"occupied": 0.0, "unknown": 0.0}
    for f in g.get("features", []):
        geom, kind = f.get("geometry") or {}, classify(f.get("properties", {}).get("name"))
        if kind not in acc:
            continue
        if geom.get("type") == "Polygon":
            acc[kind] += poly_area(geom["coordinates"])
        elif geom.get("type") == "MultiPolygon":
            acc[kind] += sum(poly_area(p) for p in geom["coordinates"])
    return {k: round(v) for k, v in acc.items()}


def main(weeks=12):
    hist = sorted(get(f"{API}/public"), key=lambda x: x["id"])
    latest = hist[-1]["id"]
    picks = []
    for w in range(weeks, -1, -1):
        target = latest - w * 7 * 86400
        best = min(hist, key=lambda x: abs(x["id"] - target))
        if not picks or picks[-1] != best["id"]:
            picks.append(best["id"])
    points = []
    for gid in picks:
        a = areas(gid)
        d = dt.datetime.fromtimestamp(gid, dt.timezone.utc).date().isoformat()
        points.append({"date": d, **a})
        print(f"  front {d}: оккуп. {a['occupied']:,} км², серая {a['unknown']:,} км²")
    out = {"updated": dt.date.today().isoformat(), "source": "DeepState", "url": "https://deepstatemap.live", "points": points}
    OUT.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return out


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
