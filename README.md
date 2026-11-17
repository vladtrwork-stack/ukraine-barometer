# Барометр Украины

Еженедельный независимый индекс устойчивости Украины по открытым данным.

Интерфейс и брифинги на трёх языках: русском, украинском, английском (переключатель в шапке).

Статический сайт без бэкенда. Раз в неделю появляется новый брифинг: числа подтягиваются скриптом, аналитику пишет Claude.

## Структура

```
collect.py              все автоисточники: НБУ → indicators.json, затем DeepState и Prozorro
collect_front.py        площадь оккупированной и «серой» территории (DeepState) → site/data/front.json
collect_prozorro.py     закупки: темы риска за 30 дней и доля без конкуренции по регионам → site/data/procurement.json
make_card.py            карточка для соцсетей site/card.png и текст поста build/telegram_<lang>.txt (--send — отправить)
build_artifact.py       сборка версии для Claude Artifact → build/artifact.html
site/                   сам сайт: его и выкладывать на хостинг
  index.html, style.css, app.js
  data/indicators.json          ряды: курсы USD/EUR/PLN, резервы, учётная ставка
  data/briefs/index.json        список недель (период на ru/uk/en)
  data/briefs/YYYY-MM-DD/ru.json, uk.json, en.json   брифинг недели на трёх языках
data/snapshot_*.json    архив сырых снимков
UPDATE.md               пошаговая инструкция еженедельного обновления (для Claude)
```

## Запуск локально

```bash
python -m http.server 8000 --directory site
```

Потом откройте http://localhost:8000. Если открыть `index.html` двойным кликом, данные не загрузятся: браузер запрещает `fetch` с диска.

## Еженедельное обновление

1. `python collect.py`: свежие курсы, ставка и резервы.
2. Создать `site/data/briefs/<дата>/ru.json`, `uk.json`, `en.json` (одинаковая структура, разный язык) и добавить запись в `index.json`.
3. Обновить статусы в журнале: `pending` → `done` / `failed` / `partial`, поле `result`.
4. Выложить папку `site/`.

Шаги 2–3 выполняет Claude по [UPDATE.md](UPDATE.md).

## Схема брифинга

| Поле | Что внутри |
|---|---|
| `headline[]` | `level` (crit / warn / info / ok), `title`, `text` |
| `kpis[]` | `label`, `value`, `sub`, `dir` (good / bad / neutral), `source`, `unverified` |
| `domains[]` | `id` (стабильный между неделями), `name`, `status`, `statusLabel`, `score` 1–5, `trend` (up / down / flat), `situation[]`, `diagnosis`, `recs[]` |
| `recs[]` | `lever` (рычаг президента), `title`, `what`, `cost`, `metric`, `effect` (как предложение улучшит ситуацию) |
| `corruption` | `lead`, `kpis[]`, `systemic[]` (`low`/`high`, млрд грн/год), `cases[]` (`uah` — сумма для пересчёта), `spheres[]` (`risk` 1–5, `schemes`, `without`), `recs[]`, `note`, `constants` |
| `priorities[]` | `title`, `text` |
| `journal[]` | `rec` (ключ, по нему записи сливаются между неделями), `check`, `due`, `status`, `result`, `prob` (вероятность 0–1) |
| `scenarios[]` | `id` (base/pess/opt), `prob`, `index` [мин, макс], `name`, `text`, `triggers[]` |
| `russia` | `lead`, `kpis[]` (как kpis), `note` |
| `gaps[]`, `sources[]` | пробелы в данных; `{title, url}` |

## Хостинг

Подойдёт любой статический хостинг, в корень кладётся содержимое `site/`:

- **GitHub Pages**: репозиторий → Settings → Pages → папка `/site` (или ветка `gh-pages`).
- **Netlify / Cloudflare Pages**: перетащить папку `site` или указать её как publish directory.
- Сборка и сервер не нужны.

## Методика индекса

У каждой сферы 2–4 подпоказателя (`domains[].metrics`): `raw` — значение, `better` (higher/lower), `thresholds` — 4 порога для баллов 1–5,
`weight`, `conf` (confirmed / single / estimate / expert / auto), `source`, `auto` — ключ автозначения
(`policy_rate`, `usd_13w`, `reserves_yoy`, `front_week_km2`, `prozorro_noncomp`). Балл сферы — взвешенное среднее, индекс — среднее 9 сфер.
Пороги и веса не меняются от недели к неделе без записи в `corrections`.

## «Что если»

У каждого предложения поле `impact` — экспертная оценка прироста баллов сфер за горизонт `horizon` при полном выполнении.
В интерфейсе прирост считается с убывающей отдачей: чем ближе сфера к 5, тем меньше эффект.

## Публикация как сайт

Нужен статический хостинг с папкой `site/` в корне (GitHub Pages, Cloudflare Pages, Netlify).
Перед публикацией: указать контакт для исправлений, проверить раздел «Методика и правила», задать `SITE_URL` для make_card.py.
Telegram: создать бота у @BotFather, добавить его в канал администратором, задать `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`
в переменных окружения и запускать `python make_card.py ru --send`.

## Автономная работа

| Что | Где | Когда |
|---|---|---|
| Сбор данных (НБУ, DeepState, Prozorro, тревоги) | GitHub Actions `data.yml` | каждый день 03:00 UTC |
| Выпуск недели (аналитика, 3 языка, проверка фактов) | облачная задача Claude Code, промпт в ROUTINE.md | вторник 08:00 UTC |
| Публикация сайта | GitHub Actions `pages.yml` | при каждом push в `site/` |
| Пост в Telegram | GitHub Actions `telegram.yml` | при новом выпуске |

Секреты репозитория: `ALERTS_TOKEN` (alerts.in.ua), `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`; переменная `SITE_URL`.
`site/config.json`: `siteUrl` и `repoUrl` (для кнопки «Сообщить об ошибке», RSS и виджета).
Дополнительно: `build_site.py` (проверка + CSV/RSS/latest.json), `site/embed.html` (виджет), `site/data/history.json` (реконструкция до первого выпуска).

## Ревью и защита от сбоев

- Агент открывает pull request из ветки `weekly/<дата>`; `pr-check.yml` проверяет данные. Одобри и смёрджи — или через 24 часа
  `automerge.yml` опубликует выпуск сам (если проверка прошла и не запрошены изменения).
- `health.yml` каждый день запускает `health.py`: если выпуск старше 8 дней или данные устарели, открывается Issue с меткой `health`.
- Страницы выпусков: `site/issues/<id>/` (ru, `uk.html`, `en.html`) со своей карточкой `site/cards/<id>-<lang>.png` — для ссылок в соцсетях.
- Статистика посещений: впиши код GoatCounter в `site/config.json` → `"goatcounter": "<код>"` (бесплатно, без cookies).
- Подписка: `"telegramUrl"` в `site/config.json` — ссылка на канал появится в «О проекте» рядом с RSS.
