"""Ночная яркость по областям — NASA Black Marble (VIIRS NOAA-20, gap-filled, BRDF-corrected) через открытый WMS NASA GIBS.

Без ключа. Для каждой ночи считается средняя яркость пикселей внутри границ каждой области.
Пишет site/data/lights.json:
  days: {дата: {область: яркость 0–255}}   (накапливается, хранится ~120 дней)
  weekly: {область: {"now": среднее за 7 ночей, "base": за 7 ночей 13 недель назад, "change": %}}
  national: {"now", "base", "change"}  и series: [[дата, средняя по стране за 7 ночей]] — для графика
Ограничения: яркость в PNG — не физическая радиация, а относительная шкала; облака и снег частично
сглажены продуктом gap-filled; показатель экспериментальный и помечается как оценка.
Оккупированные территории в национальное среднее не входят.
"""
import json, sys, time, io, pathlib, datetime as dt, urllib.request, urllib.parse
from PIL import Image, ImageDraw, ImageStat

ROOT = pathlib.Path(__file__).parent
DATA = ROOT / "site" / "data"
OUT = DATA / "lights.json"
LAYER = "VIIRS_NOAA20_GapFilled_BRDF_Corrected_DayNightBand_Radiance"
BBOX = (44.0, 22.0, 53.0, 41.0)  # lat_min, lon_min, lat_max, lon_max (WMS 1.3.0, EPSG:4326)
W, H = 1140, 540  # ~0.0167° на пиксель
EXCLUDE_NATIONAL = {"crimea", "luhansk", "donetsk"}  # преимущественно оккупированы


def fetch(date):
    q = {"SERVICE": "WMS", "REQUEST": "GetMap", "VERSION": "1.3.0", "LAYERS": LAYER, "CRS": "EPSG:4326",
         "BBOX": ",".join(map(str, BBOX)), "WIDTH": W, "HEIGHT": H, "FORMAT": "image/png", "TIME": date}
    url = "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?" + urllib.parse.urlencode(q)
    for a in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "barometer/1.0"}), timeout=120) as r:
                data = r.read()
            if len(data) < 5000:
                return None  # пустой кадр — данных за дату ещё нет
            return Image.open(io.BytesIO(data)).convert("L")
        except Exception:
            time.sleep(5 * (a + 1))
    return None


def masks():
    ob = json.loads((DATA / "oblasts.json").read_text(encoding="utf-8"))["oblasts"]
    lat_min, lon_min, lat_max, lon_max = BBOX
    px = lambda lon, lat: ((lon - lon_min) / (lon_max - lon_min) * W, (lat_max - lat) / (lat_max - lat_min) * H)
    out = {}
    for rid, polys in ob.items():
        m = Image.new("L", (W, H), 0)
        d = ImageDraw.Draw(m)
        for p in polys:
            d.polygon([px(x, y) for x, y in p], fill=255)
        out[rid] = m
    return out


def mean_in(img, mask):
    st = ImageStat.Stat(img, mask)
    return round(st.mean[0], 3) if st.count[0] else None


def main(days_back=100):
    store = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {"days": {}}
    days = store.get("days", {})
    today = dt.date.today()
    mk = None
    for i in range(days_back, 0, -1):
        d = (today - dt.timedelta(days=i)).isoformat()
        if d in days:
            continue
        img = fetch(d)
        if img is None:
            continue
        mk = mk or masks()
        days[d] = {rid: mean_in(img, m) for rid, m in mk.items()}
        print(f"  lights {d}: ok")
        time.sleep(0.5)
    keep = sorted(days)[-130:]
    days = {d: days[d] for d in keep}
    dates = sorted(days)

    def avg(rid, ds):
        v = [days[d][rid] for d in ds if days[d].get(rid) is not None]
        return sum(v) / len(v) if v else None

    def nat(ds):
        v = [avg(r, ds) for r in days[ds[0]] if r not in EXCLUDE_NATIONAL] if ds else []
        v = [x for x in v if x is not None]
        return sum(v) / len(v) if v else None

    weekly, national, series = {}, {}, []
    if len(dates) >= 7:
        now = dates[-7:]
        last = dt.date.fromisoformat(dates[-1])
        base = [d for d in dates if (last - dt.timedelta(days=97)).isoformat() <= d <= (last - dt.timedelta(days=91)).isoformat()]
        for rid in days[dates[-1]]:
            a, b = avg(rid, now), avg(rid, base) if base else None
            weekly[rid] = {"now": round(a, 2) if a else None, "base": round(b, 2) if b else None,
                           "change": round((a / b - 1) * 100, 1) if a and b else None}
        a, b = nat(now), nat(base) if base else None
        national = {"now": round(a, 2) if a else None, "base": round(b, 2) if b else None,
                    "change": round((a / b - 1) * 100, 1) if a and b else None, "baseFrom": base[0] if base else None}
        for j in range(6, len(dates)):
            w = dates[j - 6:j + 1]
            v = nat(w)
            if v and j % 7 == (len(dates) - 1) % 7:
                series.append([dates[j], round(v, 2)])
    out = {"updated": today.isoformat(), "source": "NASA Black Marble (VIIRS NOAA-20)", "layer": LAYER,
           "days": days, "weekly": weekly, "national": national, "series": series}
    OUT.write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print(f"  lights: {len(days)} ночей, по стране {national.get('change')}% к базе")
    return out


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
