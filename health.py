"""Проверка исправности «Барометра»: свежесть выпуска и данных.

Код выхода 1 и текст проблемы в stdout, если:
  - последний выпуск старше 8 дней (облачный агент не отработал);
  - данные НБУ старше 2 дней (ночной сбор упал);
  - данные Prozorro или DeepState старше 3 дней.
GitHub Actions (health.yml) при ошибке открывает Issue — владельцу приходит уведомление.
"""
import json, sys, pathlib, datetime as dt

ROOT = pathlib.Path(__file__).parent
D = ROOT / "site" / "data"
today = dt.date.today()
problems = []


def age(iso):
    return (today - dt.date.fromisoformat(iso[:10])).days


idx = json.loads((D / "briefs/index.json").read_text(encoding="utf-8"))["briefs"]
last = max(b["id"] for b in idx)
if age(last) > 8:
    problems.append(f"Последний выпуск {last} — {age(last)} дн. назад. Облачный агент, вероятно, не отработал: проверьте https://claude.ai/code/routines")
for name, f, limit in [("НБУ", "indicators.json", 2), ("DeepState", "front.json", 3), ("Prozorro", "procurement.json", 3),
                       ("NASA", "lights.json", 4), ("GDELT", "media.json", 8)]:
    p = D / f
    if not p.exists():
        if name not in ("GDELT",):  # медиа публикуются только при полных данных
            problems.append(f"{name}: файл {f} отсутствует")
        continue
    u = json.loads(p.read_text(encoding="utf-8")).get("updated", "1970-01-01")
    if age(u) > limit:
        problems.append(f"{name}: данные от {u} ({age(u)} дн.) — проверьте workflow «Сбор данных»")

sys.stdout.reconfigure(encoding="utf-8")
if problems:
    print("\n".join(f"- {p}" for p in problems))
    sys.exit(1)
print("ok")
