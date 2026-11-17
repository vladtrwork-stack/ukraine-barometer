"""Геометрия: упрощение полигонов, проекция, границы областей.

python geo.py  — скачивает границы областей (OpenStreetMap через проект ukraine_geojson),
                 упрощает и пишет site/data/oblasts.json. Достаточно запустить один раз.
"""
import json, math, sys, pathlib, urllib.request

ROOT = pathlib.Path(__file__).parent
OUT = ROOT / "site" / "data" / "oblasts.json"
SRC = "https://raw.githubusercontent.com/EugeneBorshch/ukraine_geojson/master/UA_FULL_Ukraine.geojson"
# основа названия (укр.) → id области «Барометра»
STEMS = {"Волин": "volyn", "Рівн": "rivne", "Житомир": "zhytomyr", "Київська": "kyivobl", "Чернігів": "chernihiv", "Сум": "sumy",
         "Львів": "lviv", "Тернопіл": "ternopil", "Хмельниц": "khmelnytskyi", "Вінниц": "vinnytsia", "Полтав": "poltava",
         "Харків": "kharkiv", "Луган": "luhansk", "Закарпат": "zakarpattia", "Івано": "ivanofrankivsk", "Чернівец": "chernivtsi",
         "Кіровоград": "kirovohrad", "Черкас": "cherkasy", "Дніпропетров": "dnipro", "Донец": "donetsk", "Одес": "odesa",
         "Миколаїв": "mykolaiv", "Херсон": "kherson", "Запоріз": "zaporizhzhia", "Крим": "crimea"}


def _perp(p, a, b):
    if a == b:
        return math.dist(p, a)
    (x, y), (x1, y1), (x2, y2) = p, a, b
    return abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) / math.dist(a, b)


def simplify(pts, tol):
    """Дуглас — Пекер (итеративно)."""
    if len(pts) < 4:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        s, e = stack.pop()
        dmax, idx = 0, None
        for i in range(s + 1, e):
            d = _perp(pts[i], pts[s], pts[e])
            if d > dmax:
                dmax, idx = d, i
        if idx is not None and dmax > tol:
            keep[idx] = True
            stack += [(s, idx), (idx, e)]
    return [p for p, k in zip(pts, keep) if k]


def rings_of(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return geom["coordinates"]
    return []


def main():
    g = json.loads(urllib.request.urlopen(urllib.request.Request(SRC, headers={"User-Agent": "barometer/1.0"}), timeout=90).read())
    out = {"source": "OpenStreetMap / ukraine_geojson", "oblasts": {}}
    for f in g["features"]:
        name = f["properties"].get("name:uk") or f["properties"].get("name", "")
        rid = next((v for k, v in STEMS.items() if name.startswith(k) or (k == "Крим" and k in name)), None)
        if not rid:
            continue
        # Все кольца всех полигонов: в исходнике внешний контур не всегда первый (острова идут раньше).
        # Отверстия (например, Киев внутри Киевской области) корректно вырезаются правилом evenodd при отрисовке.
        polys = []
        for poly in rings_of(f["geometry"]):
            for ring in poly:
                pts = [(round(x, 3), round(y, 3)) for x, y in ring]
                s = simplify(pts, 0.012)
                if len(s) >= 4:
                    polys.append(s)
        out["oblasts"][rid] = polys
    # Киев (город) внутри Киевской области — отдельной геометрии нет, рисуется точкой
    out["kyiv_city"] = [30.52, 50.45]
    OUT.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print(f"oblasts: {len(out['oblasts'])}, {OUT.stat().st_size // 1024} КБ")


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
