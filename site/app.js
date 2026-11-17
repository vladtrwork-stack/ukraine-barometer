/* Барометр Украины. Читает data/briefs/index.json, брифинги data/briefs/<id>/<lang>.json,
   data/indicators.json (НБУ), data/front.json (DeepState), data/procurement.json (Prozorro).
   Без зависимостей: графики, радар, карта — ручной SVG/HTML. */
(() => {
  "use strict";

  /* ======================= Тексты интерфейса ======================= */
  const I18N = {
    ru: {
      locale: "ru-RU", brand: "Барометр", brandSub: "еженедельный индекс по открытым данным",
      nav: { overview: "Обзор", story: "История", markets: "Данные", domains: "Разбор", whatif: "Что если", russia: "Россия", map: "Карта", corruption: "Коррупция", journal: "Журнал", decisions: "Решения", method: "Методика", about: "О проекте" },
      storyTitle: "История недели", storySub: "листайте — визуализация меняется вместе с текстом",
      decisions: "Трекер решений", decisionsSub: "что приняли, подписали и что застряло",
      dstatus: { adopted: "Принято", signed: "Подписано", pending: "Не принято", rejected: "Отклонено", vetoed: "Вето" },
      media: "Внимание мировых СМИ", mediaSub: "публикации об Украине по сферам за 7 дней · GDELT", tone: "тон", toneNote: "Тон: от −10 (резко негативный) до +10. Внимание — сколько пишут о сфере, а не насколько всё плохо.",
      lights: "Ночная яркость", lightsSub: "спутник NASA Black Marble, к уровню 13 недель назад", lightsNote: "Экспериментальный показатель: средняя яркость ночных снимков по подконтрольным областям. Падение означает отключения и экономию света.",
      mapPlay: "Проиграть", mapPause: "Пауза", occupied: "Оккупировано (DeepState)", week: "неделя",
      scenTitle: "Сценарии на 3 месяца", scenSub: "вероятности пересматриваются каждую неделю", scenIdx: "индекс", scenTrig: "Что укажет на этот сценарий",
      russia: "Россия: возможности противника", russiaSub: "деньги, топливо, экономика",
      prob: "Вероятность", brier: "Точность прогнозов (Brier)", brierNote: (n) => `по ${n} проверенным прогнозам; 0 — идеально, 0,25 — как подбрасывание монеты`,
      avgConf: (n, p) => `${n} прогнозов, средняя уверенность ${p}%`,
      compare: "Сравнить с выпуском", compareNone: "Сравнение появится со второго выпуска.", delta: "Изменение",
      search: "Поиск по выпускам", searchPh: "Поиск по выпускам…", noResults: "Ничего не найдено",
      validation: "Проверка методики на истории", subscribe: "Подписаться в Telegram", shareIssue: "Ссылка на этот выпуск",
      trendTitle: "Динамика индекса", trendNote: "пунктир — реконструкция до первого выпуска", sens: (a, b) => `при весах ±20%: ${a}–${b}`,
      about: "О проекте", aboutLead: "«Барометр Украины» — независимый открытый проект. Каждую неделю он оценивает 9 сфер жизни страны по открытым данным и публикует предложения, которые могли бы улучшить ситуацию.",
      aboutWho: "Кто делает", aboutWhoText: "Выпуски готовит автоматический ИИ-агент (Claude, Anthropic) по фиксированной методике: собирает открытые данные и новости, считает индекс, пишет разбор на трёх языках и проверяет цифры отдельным проходом. У каждой цифры есть ссылка на источник. Проект не связан с государственными органами, партиями или донорами и не получает финансирования.",
      aboutLimits: "Ограничения", aboutLimitsText: "ИИ может ошибаться. Оценки сфер — модель, а не истина; экспертные показатели помечены. Мы не используем закрытые данные и намеренно не публикуем то, что может помочь противнику.",
      aboutFix: "Нашли ошибку?", aboutFixText: "Сообщите — исправление появится в разделе «Исправления» с датой.", reportBtn: "Сообщить об ошибке",
      dataTitle: "Открытые данные", dataText: "Все данные «Барометра» можно скачать и использовать со ссылкой на источник.", dlCsv: "Индекс по неделям (CSV)", dlJson: "Выпуск недели (JSON)", rss: "RSS-лента",
      embedTitle: "Виджет для сайта", embedText: "Вставьте код, чтобы показать актуальный индекс на своём сайте:", copy: "Скопировать", copied: "Скопировано",
      stamp: "Открытые источники", briefNo: "Выпуск №", compiled: "составлен",
      title: "Барометр <em>Украины</em>",
      lead: "Еженедельная независимая оценка 9 сфер страны, включая фронт и оборону: что изменилось, почему это важно и какие решения могли бы улучшить ситуацию.",
      index: "Индекс устойчивости", indexNote: "Среднее по 9 сферам, шкала 1–5. Каждая сфера считается из измеримых подпоказателей с весами — см. «Методика».",
      vsPrev: "к прошлой неделе", firstWeek: "первая неделя наблюдений",
      status: { crit: "Критично", warn: "Внимание", info: "Возможность", ok: "Устойчиво" },
      headlines: "Главное за неделю", profile: "Профиль сфер", thisWeek: "Эта неделя", prevWeek: "Прошлая неделя", projected: "С предложениями",
      changes: "Что изменилось", changesFirst: "Это первый выпуск: сравнивать пока не с чем. Со следующей недели здесь появятся изменения оценок, статусов, новых дел и журнала.",
      chIndex: "Индекс устойчивости", chStatus: "статус", chNewCase: "Новое дело", chJournal: "Журнал",
      spheres: "Состояние сфер", spheresSub: "оценка 1–5 по методике · тренд · нажмите, чтобы открыть разбор",
      historyNote: "История статусов появится со второй недели.", sphere: "Сфера",
      trend: { up: "↑ лучше", down: "↓ хуже", flat: "→ без изм." },
      markets: "Финансовые рынки", marketsSub: "автоматически из API НБУ", on: "на",
      weekKpis: "Показатели недели", weekKpisSub: "из новостей, отчётов и открытых данных", auto: "авто", unverified: "не подтв.",
      conf: { confirmed: "подтверждено", single: "один источник", estimate: "оценка", expert: "экспертная оценка", auto: "авто" },
      perWeek: "за нед", per3m: "за 3 мес", perYear: "за год", was: "было", changedAfter: "изменена после", unchanged: "без изменений",
      hover: "наведите на график, чтобы увидеть значение", source: "Источник",
      domains: "Разбор по сферам", domainsSub: "ситуация → диагноз → предложения", all: "Все",
      situation: "Ситуация", diagnosis: "Диагноз", decisions: "Предложения", nDec: "предл.",
      what: "Что", cost: "Цена", metric: "Контроль", proposal: "Предложение", effect: "Как это улучшит ситуацию",
      disclaimer: "Это предложения аналитиков «Барометра», а не принятые меры. Для каждого указано, как оно, по нашей оценке, улучшило бы ситуацию. Эффект ожидаемый, а не гарантированный.",
      scoreHow: "Из чего складывается оценка", mCols: ["Подпоказатель", "Значение", "Балл", "Вес", "Надёжность"],
      priorities: "Приоритеты недели",
      whatif: "Что если: моделирование предложений", whatifSub: (h) => `прогноз на ${h} при полном выполнении`,
      whatifLead: "Отметьте предложения, которые были бы выполнены, и посмотрите, как изменились бы оценки сфер и индекс. Влияние каждого предложения — экспертная оценка «Барометра», а не точный расчёт.",
      selAll: "Выбрать все", selNone: "Сбросить", selected: "выбрано", corrGroup: "Антикоррупция (отдельный блок)",
      map: "Карта областей", mapSub: "границы областей · оккупированная территория по неделям",
      layers: { status: "Положение", lights: "Ночная яркость, %", alerts: "Часы тревог за неделю", noncomp: "Закупки без конкуренции, %", volume: "Закупок за неделю" },
      regStatus: { occupied: "Оккупирована", partial: "Частично оккупирована", front: "Прифронтовая / приграничная", rear: "Тыловая" },
      noData: "нет данных", mapNote: "Положение областей — общеизвестная публичная информация. Закупки — открытый API Prozorro за 7 дней, по региону заказчика; доля без конкуренции считается по числу закупок.",
      corrTitle: "Коррупционная составляющая", corrRisk: "Коррупционный риск", priceTitle: "Цена коррупции: что можно было бы купить на эти деньги",
      priceSub: "пересчёт сумм дел по курсу НБУ", shelters: "бетонных укрытий для подстанций", interceptors: "дронов-перехватчиков",
      dotNote: (k) => k === 1 ? "1 квадрат = 1 укрытие" : `1 квадрат = ${k} укрытий`,
      systemicTitle: "Системные потери бюджета", systemicSub: "оценки, млрд грн в год",
      riskTitle: "Риск по сферам", riskSub: "1 — низкий, 5 — очень высокий", withoutTitle: "Если бы не было коррупции",
      casesTitle: "Известные дела", casesCols: ["Дело", "Сфера", "Сумма", "Стадия"], corrRecs: "Антикоррупционные предложения", basis: "Основа пересчёта",
      procTitle: "Prozorro: темы риска за 30 дней", procSub: "автоматически из открытого API", procTotal: "закупок в темах риска", procNon: "суммы — без конкуренции",
      procCols: ["Тема", "Закупок", "Сумма, грн", "Без конкуренции"], procTop: "Крупнейшие закупки без конкуренции по темам риска",
      procNote: "Закупка без конкуренции (отчёт, переговорная процедура) — законный инструмент и сигнал для проверки, а не доказательство нарушения. Значительная часть оборонных закупок в Prozorro не публикуется. Выборка — до 300 последних закупок на тему (≈ — выборка неполная), доля считается по сумме.",
      topics: { energy_protection: "Защита энергообъектов", drones: "Дроны и БПЛА", fortification: "Фортификации", generators: "Генераторы и когенерация", shelters: "Укрытия в школах и больницах" },
      journal: "Журнал предложений", jcols: ["Предложение", "Что проверить", "Вероятность", "Срок", "Статус", "Итог"],
      jstatus: { pending: "Ожидает", done: "Выполнено", failed: "Не выполнено", partial: "Частично" }, overdue: "просрочено",
      accuracy: "Точность прогнозов", accNone: "Первые проверки — 30 ноября", accOf: (a, b) => `проверено ${a} из ${b}`,
      method: "Методика и правила", methodIndex: "Как считается индекс",
      methodIndexText: "Каждая сфера состоит из 2–4 подпоказателей. Для каждого заданы пороги: значение переводится в балл от 1 до 5, баллы усредняются с весами. Индекс устойчивости — среднее по 9 сферам. Пороги и веса открыты в разборе каждой сферы. Часть показателей обновляется автоматически (НБУ, DeepState, Prozorro), часть — по новостям и отчётам, экспертные оценки помечены отдельно.",
      confLegend: "Надёжность данных", rules: "Редакционные правила",
      rulesList: ["Используем только уже опубликованную открытую информацию. Не публикуем и не сводим вместе данные, которые могли бы помочь противнику: точные позиции, состояние конкретных объектов защиты, графики работы ПВО.",
        "Подозрение не означает вины. Все дела описываются по версии следствия; о закрытии дел и оправдательных приговорах сообщаем так же заметно, как о подозрениях.",
        "Цифры из одного источника и оценки помечаются. Если источники расходятся, показываем диапазон.",
        "Предложения — мнение аналитиков, а не позиция государственных органов."],
      corrections: "Исправления", noCorrections: "Исправлений пока не было. Все правки будут публиковаться здесь с датой.",
      gaps: "Пробелы в данных", sources: "Источники", nbuApi: "API НБУ: курсы, ставки, резервы",
      foot: "Независимая аналитика по открытым источникам. Не является позицией государственных органов.",
      updated: "Данные НБУ обновлены", loadErr: "Не удалось загрузить данные.",
      serverHint: "Если файл открыт напрямую с диска, запустите локальный сервер в папке site:",
      months: ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"],
      series: { usd: "Курс USD/UAH", eur: "Курс EUR/UAH", reserves: "Международные резервы", policy_rate: "Учётная ставка НБУ", front: "Оккупированная территория" },
      chartSpan: { usd: "за год", eur: "за год", reserves: "3 года", policy_rate: "2 года", front: "12 недель, DeepState" },
      units: { "грн": "грн", "млрд $": "млрд $", "%": "%", "км²": "км²" }, src: { "НБУ": "НБУ" },
      short: { energy: "Энергетика", airdef: "ПВО", front: "Фронт", army: "Армия", economy: "Экономика", finance: "Финансы", anticorr: "Антикорр.", diplomacy: "Дипломатия", society: "Общество" },
    },
    uk: {
      locale: "uk-UA", brand: "Барометр", brandSub: "щотижневий індекс за відкритими даними",
      nav: { overview: "Огляд", story: "Історія", markets: "Дані", domains: "Розбір", whatif: "Що як", russia: "Росія", map: "Мапа", corruption: "Корупція", journal: "Журнал", decisions: "Рішення", method: "Методика", about: "Про проєкт" },
      storyTitle: "Історія тижня", storySub: "гортайте — візуалізація змінюється разом із текстом",
      decisions: "Трекер рішень", decisionsSub: "що ухвалили, підписали і що застрягло",
      dstatus: { adopted: "Ухвалено", signed: "Підписано", pending: "Не ухвалено", rejected: "Відхилено", vetoed: "Вето" },
      media: "Увага світових ЗМІ", mediaSub: "публікації про Україну за сферами за 7 днів · GDELT", tone: "тон", toneNote: "Тон: від −10 (різко негативний) до +10. Увага — скільки пишуть про сферу, а не наскільки все погано.",
      lights: "Нічна яскравість", lightsSub: "супутник NASA Black Marble, до рівня 13 тижнів тому", lightsNote: "Експериментальний показник: середня яскравість нічних знімків по підконтрольних областях. Падіння означає відключення й економію світла.",
      mapPlay: "Програти", mapPause: "Пауза", occupied: "Окуповано (DeepState)", week: "тиждень",
      scenTitle: "Сценарії на 3 місяці", scenSub: "ймовірності переглядаються щотижня", scenIdx: "індекс", scenTrig: "Що вкаже на цей сценарій",
      russia: "Росія: можливості противника", russiaSub: "гроші, пальне, економіка",
      prob: "Ймовірність", brier: "Точність прогнозів (Brier)", brierNote: (n) => `за ${n} перевіреними прогнозами; 0 — ідеально, 0,25 — як підкидання монети`,
      avgConf: (n, p) => `${n} прогнозів, середня впевненість ${p}%`,
      compare: "Порівняти з випуском", compareNone: "Порівняння з'явиться з другого випуску.", delta: "Зміна",
      search: "Пошук у випусках", searchPh: "Пошук у випусках…", noResults: "Нічого не знайдено",
      validation: "Перевірка методики на історії", subscribe: "Підписатися в Telegram", shareIssue: "Посилання на цей випуск",
      trendTitle: "Динаміка індексу", trendNote: "пунктир — реконструкція до першого випуску", sens: (a, b) => `за вагами ±20%: ${a}–${b}`,
      about: "Про проєкт", aboutLead: "«Барометр України» — незалежний відкритий проєкт. Щотижня він оцінює 9 сфер життя країни за відкритими даними й публікує пропозиції, які могли б покращити ситуацію.",
      aboutWho: "Хто робить", aboutWhoText: "Випуски готує автоматичний ШІ-агент (Claude, Anthropic) за фіксованою методикою: збирає відкриті дані й новини, рахує індекс, пише розбір трьома мовами та перевіряє цифри окремим проходом. Кожна цифра має посилання на джерело. Проєкт не пов'язаний з державними органами, партіями чи донорами й не отримує фінансування.",
      aboutLimits: "Обмеження", aboutLimitsText: "ШІ може помилятися. Оцінки сфер — модель, а не істина; експертні показники позначені. Ми не використовуємо закриті дані й свідомо не публікуємо те, що може допомогти противнику.",
      aboutFix: "Знайшли помилку?", aboutFixText: "Повідомте — виправлення з'явиться в розділі «Виправлення» з датою.", reportBtn: "Повідомити про помилку",
      dataTitle: "Відкриті дані", dataText: "Усі дані «Барометра» можна завантажити й використовувати з посиланням на джерело.", dlCsv: "Індекс за тижнями (CSV)", dlJson: "Випуск тижня (JSON)", rss: "RSS-стрічка",
      embedTitle: "Віджет для сайту", embedText: "Вставте код, щоб показати актуальний індекс на своєму сайті:", copy: "Скопіювати", copied: "Скопійовано",
      stamp: "Відкриті джерела", briefNo: "Випуск №", compiled: "складено",
      title: "Барометр <em>України</em>",
      lead: "Щотижнева незалежна оцінка 9 сфер країни, зокрема фронту й оборони: що змінилося, чому це важливо і які рішення могли б покращити ситуацію.",
      index: "Індекс стійкості", indexNote: "Середнє за 9 сферами, шкала 1–5. Кожна сфера рахується з вимірюваних підпоказників із вагами — див. «Методика».",
      vsPrev: "до минулого тижня", firstWeek: "перший тиждень спостережень",
      status: { crit: "Критично", warn: "Увага", info: "Можливість", ok: "Стійко" },
      headlines: "Головне за тиждень", profile: "Профіль сфер", thisWeek: "Цей тиждень", prevWeek: "Минулий тиждень", projected: "З пропозиціями",
      changes: "Що змінилося", changesFirst: "Це перший випуск: порівнювати поки нема з чим. З наступного тижня тут з'являться зміни оцінок, статусів, нових справ і журналу.",
      chIndex: "Індекс стійкості", chStatus: "статус", chNewCase: "Нова справа", chJournal: "Журнал",
      spheres: "Стан сфер", spheresSub: "оцінка 1–5 за методикою · тренд · натисніть, щоб відкрити розбір",
      historyNote: "Історія статусів з'явиться з другого тижня.", sphere: "Сфера",
      trend: { up: "↑ краще", down: "↓ гірше", flat: "→ без змін" },
      markets: "Фінансові ринки", marketsSub: "автоматично з API НБУ", on: "на",
      weekKpis: "Показники тижня", weekKpisSub: "з новин, звітів і відкритих даних", auto: "авто", unverified: "не підтв.",
      conf: { confirmed: "підтверджено", single: "одне джерело", estimate: "оцінка", expert: "експертна оцінка", auto: "авто" },
      perWeek: "за тиж", per3m: "за 3 міс", perYear: "за рік", was: "було", changedAfter: "змінена після", unchanged: "без змін",
      hover: "наведіть на графік, щоб побачити значення", source: "Джерело",
      domains: "Розбір за сферами", domainsSub: "ситуація → діагноз → пропозиції", all: "Усі",
      situation: "Ситуація", diagnosis: "Діагноз", decisions: "Пропозиції", nDec: "проп.",
      what: "Що", cost: "Ціна", metric: "Контроль", proposal: "Пропозиція", effect: "Як це покращить ситуацію",
      disclaimer: "Це пропозиції аналітиків «Барометра», а не ухвалені заходи. Для кожної зазначено, як вона, за нашою оцінкою, покращила б ситуацію. Ефект очікуваний, а не гарантований.",
      scoreHow: "З чого складається оцінка", mCols: ["Підпоказник", "Значення", "Бал", "Вага", "Надійність"],
      priorities: "Пріоритети тижня",
      whatif: "Що як: моделювання пропозицій", whatifSub: (h) => `прогноз на ${h} за повного виконання`,
      whatifLead: "Позначте пропозиції, які були б виконані, і подивіться, як змінилися б оцінки сфер та індекс. Вплив кожної пропозиції — експертна оцінка «Барометра», а не точний розрахунок.",
      selAll: "Вибрати всі", selNone: "Скинути", selected: "вибрано", corrGroup: "Антикорупція (окремий блок)",
      map: "Мапа областей", mapSub: "межі областей · окупована територія за тижнями",
      layers: { status: "Становище", lights: "Нічна яскравість, %", alerts: "Години тривог за тиждень", noncomp: "Закупівлі без конкуренції, %", volume: "Закупівель за тиждень" },
      regStatus: { occupied: "Окупована", partial: "Частково окупована", front: "Прифронтова / прикордонна", rear: "Тилова" },
      noData: "немає даних", mapNote: "Становище областей — загальновідома публічна інформація. Закупівлі — відкритий API Prozorro за 7 днів, за регіоном замовника; частка без конкуренції рахується за кількістю закупівель.",
      corrTitle: "Корупційна складова", corrRisk: "Корупційний ризик", priceTitle: "Ціна корупції: що можна було б купити за ці гроші",
      priceSub: "перерахунок сум справ за курсом НБУ", shelters: "бетонних укриттів для підстанцій", interceptors: "дронів-перехоплювачів",
      dotNote: (k) => k === 1 ? "1 квадрат = 1 укриття" : `1 квадрат = ${k} укриттів`,
      systemicTitle: "Системні втрати бюджету", systemicSub: "оцінки, млрд грн на рік",
      riskTitle: "Ризик за сферами", riskSub: "1 — низький, 5 — дуже високий", withoutTitle: "Якби не було корупції",
      casesTitle: "Відомі справи", casesCols: ["Справа", "Сфера", "Сума", "Стадія"], corrRecs: "Антикорупційні пропозиції", basis: "Основа перерахунку",
      procTitle: "Prozorro: теми ризику за 30 днів", procSub: "автоматично з відкритого API", procTotal: "закупівель у темах ризику", procNon: "суми — без конкуренції",
      procCols: ["Тема", "Закупівель", "Сума, грн", "Без конкуренції"], procTop: "Найбільші закупівлі без конкуренції за темами ризику",
      procNote: "Закупівля без конкуренції (звіт, переговорна процедура) — законний інструмент і сигнал для перевірки, а не доказ порушення. Значна частина оборонних закупівель у Prozorro не публікується. Вибірка — до 300 останніх закупівель на тему (≈ — вибірка неповна), частка рахується за сумою.",
      topics: { energy_protection: "Захист енергооб'єктів", drones: "Дрони та БПЛА", fortification: "Фортифікації", generators: "Генератори й когенерація", shelters: "Укриття у школах і лікарнях" },
      journal: "Журнал пропозицій", jcols: ["Пропозиція", "Що перевірити", "Ймовірність", "Термін", "Статус", "Підсумок"],
      jstatus: { pending: "Очікує", done: "Виконано", failed: "Не виконано", partial: "Частково" }, overdue: "прострочено",
      accuracy: "Точність прогнозів", accNone: "Перші перевірки — 30 листопада", accOf: (a, b) => `перевірено ${a} з ${b}`,
      method: "Методика і правила", methodIndex: "Як рахується індекс",
      methodIndexText: "Кожна сфера складається з 2–4 підпоказників. Для кожного задано пороги: значення переводиться в бал від 1 до 5, бали усереднюються з вагами. Індекс стійкості — середнє за 9 сферами. Пороги й ваги відкриті в розборі кожної сфери. Частина показників оновлюється автоматично (НБУ, DeepState, Prozorro), частина — за новинами й звітами, експертні оцінки позначені окремо.",
      confLegend: "Надійність даних", rules: "Редакційні правила",
      rulesList: ["Використовуємо лише вже опубліковану відкриту інформацію. Не публікуємо й не зводимо разом дані, які могли б допомогти противнику: точні позиції, стан конкретних об'єктів захисту, графіки роботи ППО.",
        "Підозра не означає вини. Усі справи описуються за версією слідства; про закриття справ і виправдувальні вироки повідомляємо так само помітно, як про підозри.",
        "Цифри з одного джерела та оцінки позначаються. Якщо джерела розходяться, показуємо діапазон.",
        "Пропозиції — думка аналітиків, а не позиція державних органів."],
      corrections: "Виправлення", noCorrections: "Виправлень поки не було. Усі правки публікуватимуться тут із датою.",
      gaps: "Прогалини в даних", sources: "Джерела", nbuApi: "API НБУ: курси, ставки, резерви",
      foot: "Незалежна аналітика за відкритими джерелами. Не є позицією державних органів.",
      updated: "Дані НБУ оновлено", loadErr: "Не вдалося завантажити дані.",
      serverHint: "Якщо файл відкрито напряму з диска, запустіть локальний сервер у папці site:",
      months: ["січ", "лют", "бер", "кві", "тра", "чер", "лип", "сер", "вер", "жов", "лис", "гру"],
      series: { usd: "Курс USD/UAH", eur: "Курс EUR/UAH", reserves: "Міжнародні резерви", policy_rate: "Облікова ставка НБУ", front: "Окупована територія" },
      chartSpan: { usd: "за рік", eur: "за рік", reserves: "3 роки", policy_rate: "2 роки", front: "12 тижнів, DeepState" },
      units: { "грн": "грн", "млрд $": "млрд $", "%": "%", "км²": "км²" }, src: { "НБУ": "НБУ" },
      short: { energy: "Енергетика", airdef: "ППО", front: "Фронт", army: "Армія", economy: "Економіка", finance: "Фінанси", anticorr: "Антикор.", diplomacy: "Дипломатія", society: "Суспільство" },
    },
    en: {
      locale: "en-GB", brand: "Barometer", brandSub: "a weekly index from open data",
      nav: { overview: "Overview", story: "Story", markets: "Data", domains: "Analysis", whatif: "What if", russia: "Russia", map: "Map", corruption: "Corruption", journal: "Track record", decisions: "Decisions", method: "Method", about: "About" },
      storyTitle: "The week in a story", storySub: "scroll and the visual changes with the text",
      decisions: "Decision tracker", decisionsSub: "what was adopted, signed and what is stuck",
      dstatus: { adopted: "Adopted", signed: "Signed", pending: "Not adopted", rejected: "Rejected", vetoed: "Vetoed" },
      media: "World media attention", mediaSub: "coverage of Ukraine by area over 7 days · GDELT", tone: "tone", toneNote: "Tone runs from −10 (sharply negative) to +10. Attention is how much is written about an area, not how bad things are.",
      lights: "Night-time brightness", lightsSub: "NASA Black Marble satellite, vs 13 weeks ago", lightsNote: "Experimental: average brightness of night imagery over government-controlled oblasts. A fall means outages and power saving.",
      mapPlay: "Play", mapPause: "Pause", occupied: "Occupied (DeepState)", week: "week",
      scenTitle: "Scenarios for the next 3 months", scenSub: "probabilities are revised every week", scenIdx: "index", scenTrig: "Signals of this scenario",
      russia: "Russia: the enemy's capacity", russiaSub: "money, fuel, the economy",
      prob: "Probability", brier: "Forecast accuracy (Brier)", brierNote: (n) => `over ${n} resolved forecasts; 0 is perfect, 0.25 is a coin toss`,
      avgConf: (n, p) => `${n} forecasts, average confidence ${p}%`,
      compare: "Compare with issue", compareNone: "Comparison becomes available from the second issue.", delta: "Change",
      search: "Search issues", searchPh: "Search issues…", noResults: "Nothing found",
      validation: "Testing the method on history", subscribe: "Subscribe on Telegram", shareIssue: "Link to this issue",
      trendTitle: "Index over time", trendNote: "dashed — reconstruction before the first issue", sens: (a, b) => `with weights ±20%: ${a}–${b}`,
      about: "About", aboutLead: "Ukraine Barometer is an independent open project. Every week it assesses nine areas of national life from open data and publishes proposals that could improve the situation.",
      aboutWho: "Who makes it", aboutWhoText: "Issues are prepared by an automated AI agent (Claude, by Anthropic) following a fixed method: it collects open data and news, computes the index, writes the analysis in three languages and checks the figures in a separate pass. Every figure links to its source. The project has no ties to state bodies, parties or donors and receives no funding.",
      aboutLimits: "Limitations", aboutLimitsText: "AI can make mistakes. Area scores are a model, not the truth; expert judgements are marked. We use no classified data and deliberately do not publish anything that could help the enemy.",
      aboutFix: "Found a mistake?", aboutFixText: "Let us know and the correction will appear under Corrections with a date.", reportBtn: "Report a mistake",
      dataTitle: "Open data", dataText: "All Barometer data can be downloaded and reused with attribution.", dlCsv: "Index by week (CSV)", dlJson: "This issue (JSON)", rss: "RSS feed",
      embedTitle: "Website widget", embedText: "Paste this code to show the current index on your site:", copy: "Copy", copied: "Copied",
      stamp: "Open sources", briefNo: "Issue No.", compiled: "compiled",
      title: "Ukraine <em>Barometer</em>",
      lead: "A weekly independent assessment of nine areas of national life, including the front line and defence: what changed, why it matters, and which decisions could improve the situation.",
      index: "Resilience index", indexNote: "Average of 9 areas on a 1–5 scale. Each area is built from measurable weighted sub-indicators; see Method.",
      vsPrev: "vs last week", firstWeek: "first week of tracking",
      status: { crit: "Critical", warn: "Watch", info: "Opportunity", ok: "Resilient" },
      headlines: "This week's key points", profile: "Area profile", thisWeek: "This week", prevWeek: "Last week", projected: "With proposals",
      changes: "What changed", changesFirst: "This is the first issue, so there is nothing to compare yet. From next week this will list changes in scores, statuses, new cases and the track record.",
      chIndex: "Resilience index", chStatus: "status", chNewCase: "New case", chJournal: "Track record",
      spheres: "Area status", spheresSub: "score 1–5 by method · trend · click to open the analysis",
      historyNote: "Status history appears from week two.", sphere: "Area",
      trend: { up: "↑ better", down: "↓ worse", flat: "→ steady" },
      markets: "Financial markets", marketsSub: "automatically from the NBU API", on: "as of",
      weekKpis: "Key figures this week", weekKpisSub: "from news, reports and open data", auto: "auto", unverified: "unverified",
      conf: { confirmed: "confirmed", single: "single source", estimate: "estimate", expert: "expert judgement", auto: "auto" },
      perWeek: "1w", per3m: "3m", perYear: "1y", was: "was", changedAfter: "changed after", unchanged: "unchanged",
      hover: "hover over the chart to see values", source: "Source",
      domains: "Analysis by area", domainsSub: "situation → diagnosis → proposals", all: "All",
      situation: "Situation", diagnosis: "Diagnosis", decisions: "Proposals", nDec: "prop.",
      what: "What", cost: "Cost", metric: "Measure", proposal: "Proposal", effect: "How this would help",
      disclaimer: "These are proposals by the Barometer's analysts, not measures already taken. Each states how, in our assessment, it would improve the situation. The effect is expected, not guaranteed.",
      scoreHow: "How the score is built", mCols: ["Sub-indicator", "Value", "Score", "Weight", "Reliability"],
      priorities: "Priorities this week",
      whatif: "What if: modelling the proposals", whatifSub: (h) => `projection over ${h} if fully delivered`,
      whatifLead: "Tick the proposals that would be carried out and see how area scores and the index would change. Each proposal's impact is the Barometer's expert estimate, not a precise calculation.",
      selAll: "Select all", selNone: "Clear", selected: "selected", corrGroup: "Anti-corruption (separate block)",
      map: "Oblast map", mapSub: "oblast borders · occupied territory by week",
      layers: { status: "Situation", lights: "Night brightness, %", alerts: "Air-alert hours this week", noncomp: "Non-competitive procurement, %", volume: "Procurements this week" },
      regStatus: { occupied: "Occupied", partial: "Partly occupied", front: "Front-line / border", rear: "Rear" },
      noData: "no data", mapNote: "Oblast situation is common public knowledge. Procurement comes from the open Prozorro API over 7 days, by buyer's region; the non-competitive share is by number of procurements.",
      corrTitle: "The corruption factor", corrRisk: "Corruption risk", priceTitle: "The price of corruption: what this money could have bought",
      priceSub: "case amounts converted at the NBU rate", shelters: "concrete substation shelters", interceptors: "interceptor drones",
      dotNote: (k) => k === 1 ? "1 square = 1 shelter" : `1 square = ${k} shelters`,
      systemicTitle: "Systemic budget losses", systemicSub: "estimates, UAH bn per year",
      riskTitle: "Risk by area", riskSub: "1 low, 5 very high", withoutTitle: "If there were no corruption",
      casesTitle: "Known cases", casesCols: ["Case", "Area", "Amount", "Stage"], corrRecs: "Anti-corruption proposals", basis: "Conversion basis",
      procTitle: "Prozorro: risk topics, last 30 days", procSub: "automatically from the open API", procTotal: "procurements in risk topics", procNon: "of value non-competitive",
      procCols: ["Topic", "Procurements", "Value, UAH", "Non-competitive"], procTop: "Largest non-competitive procurements in risk topics",
      procNote: "A non-competitive procurement (report or negotiated procedure) is a legal tool and a signal to check, not proof of wrongdoing. A large share of defence procurement is not published in Prozorro. The sample is up to 300 latest procurements per topic (≈ means incomplete); the share is by value.",
      topics: { energy_protection: "Energy-site protection", drones: "Drones and UAVs", fortification: "Fortifications", generators: "Generators and cogeneration", shelters: "Shelters in schools and hospitals" },
      journal: "Proposal track record", jcols: ["Proposal", "What to check", "Probability", "Due", "Status", "Outcome"],
      jstatus: { pending: "Pending", done: "Done", failed: "Not done", partial: "Partial" }, overdue: "overdue",
      accuracy: "Forecast accuracy", accNone: "First checks on 30 November", accOf: (a, b) => `${a} of ${b} checked`,
      method: "Method and rules", methodIndex: "How the index is calculated",
      methodIndexText: "Each area consists of 2–4 sub-indicators. Each has thresholds that turn its value into a 1–5 score; scores are averaged with weights. The resilience index is the average of the 9 areas. Thresholds and weights are shown in each area's analysis. Some indicators update automatically (NBU, DeepState, Prozorro), others from news and reports; expert judgements are marked separately.",
      confLegend: "Data reliability", rules: "Editorial rules",
      rulesList: ["We use only information that is already public. We do not publish or combine data that could help the enemy: exact positions, the state of specific protected sites, air-defence schedules.",
        "A suspicion is not guilt. All cases are described as alleged by investigators; closed cases and acquittals are reported as prominently as suspicions.",
        "Single-source figures and estimates are marked. Where sources disagree, we show a range.",
        "Proposals are the analysts' opinion, not a position of any state body."],
      corrections: "Corrections", noCorrections: "No corrections yet. Every correction will be published here with a date.",
      gaps: "Data gaps", sources: "Sources", nbuApi: "NBU API: exchange rates, key rate, reserves",
      foot: "Independent analysis from open sources. Not a position of any state body.",
      updated: "NBU data updated", loadErr: "Could not load data.",
      serverHint: "If you opened the file straight from disk, run a local server in the site folder:",
      months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      series: { usd: "USD/UAH rate", eur: "EUR/UAH rate", reserves: "International reserves", policy_rate: "NBU key policy rate", front: "Occupied territory" },
      chartSpan: { usd: "1 year", eur: "1 year", reserves: "3 years", policy_rate: "2 years", front: "12 weeks, DeepState" },
      units: { "грн": "UAH", "млрд $": "$bn", "%": "%", "км²": "km²" }, src: { "НБУ": "NBU" },
      short: { energy: "Energy", airdef: "Air defence", front: "Front", army: "Manpower", economy: "Economy", finance: "Finance", anticorr: "Anti-corr.", diplomacy: "Diplomacy", society: "Society" },
    },
  };
  const LANGS = Object.keys(I18N);
  let L = I18N.ru, LANG = "ru";

  /* Области: плиточная схема (столбец, строка), названия, основа для сопоставления с Prozorro */
  const REGIONS = [
    ["volyn", 1, 0, "Волынская", "Волинська", "Volyn", "Волинськ"], ["rivne", 2, 0, "Ровенская", "Рівненська", "Rivne", "Рівненськ"],
    ["zhytomyr", 3, 0, "Житомирская", "Житомирська", "Zhytomyr", "Житомирськ"], ["kyivobl", 4, 0, "Киевская", "Київська", "Kyiv obl.", "Київська"],
    ["chernihiv", 5, 0, "Черниговская", "Чернігівська", "Chernihiv", "Чернігівськ"], ["sumy", 6, 0, "Сумская", "Сумська", "Sumy", "Сумськ"],
    ["lviv", 0, 1, "Львовская", "Львівська", "Lviv", "Львівськ"], ["ternopil", 1, 1, "Тернопольская", "Тернопільська", "Ternopil", "Тернопільськ"],
    ["khmelnytskyi", 2, 1, "Хмельницкая", "Хмельницька", "Khmelnytskyi", "Хмельницьк"], ["vinnytsia", 3, 1, "Винницкая", "Вінницька", "Vinnytsia", "Вінницьк"],
    ["kyiv", 4, 1, "Киев", "Київ", "Kyiv city", "@kyivcity"], ["poltava", 5, 1, "Полтавская", "Полтавська", "Poltava", "Полтавськ"],
    ["kharkiv", 6, 1, "Харьковская", "Харківська", "Kharkiv", "Харківськ"], ["luhansk", 7, 1, "Луганская", "Луганська", "Luhansk", "Луганськ"],
    ["zakarpattia", 0, 2, "Закарпатская", "Закарпатська", "Zakarpattia", "Закарпатськ"], ["ivanofrankivsk", 1, 2, "Ивано-Франковская", "Івано-Франківська", "Ivano-Frankivsk", "Івано-Франківськ"],
    ["chernivtsi", 2, 2, "Черновицкая", "Чернівецька", "Chernivtsi", "Чернівецьк"], ["kirovohrad", 3, 2, "Кировоградская", "Кіровоградська", "Kirovohrad", "Кіровоградськ"],
    ["cherkasy", 4, 2, "Черкасская", "Черкаська", "Cherkasy", "Черкаськ"], ["dnipro", 5, 2, "Днепропетровская", "Дніпропетровська", "Dnipropetrovsk", "Дніпропетровськ"],
    ["donetsk", 6, 2, "Донецкая", "Донецька", "Donetsk", "Донецьк"], ["odesa", 2, 3, "Одесская", "Одеська", "Odesa", "Одеськ"],
    ["mykolaiv", 3, 3, "Николаевская", "Миколаївська", "Mykolaiv", "Миколаївськ"], ["kherson", 4, 3, "Херсонская", "Херсонська", "Kherson", "Херсонськ"],
    ["zaporizhzhia", 5, 3, "Запорожская", "Запорізька", "Zaporizhzhia", "Запорізьк"], ["crimea", 4, 4, "Крым", "Крим", "Crimea", "Крим"],
  ];
  const regName = (r) => r[{ ru: 3, uk: 4, en: 5 }[LANG]];

  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const STATUS_ORDER = { crit: 0, warn: 1, info: 2, ok: 3 };
  const fmtNum = (v, d = 2) => Number(v).toLocaleString(L.locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  const fmtDate = (iso) => { const [y, m, d] = iso.split("-"); return `${+d} ${L.months[+m - 1]} ${y}`; };
  const fmtPct = (v) => (v == null ? "—" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmtNum(Math.abs(v), 1)}%`);
  const fmtBig = (v) => v >= 1e9 ? `${fmtNum(v / 1e9, 1)} ${LANG === "en" ? "bn" : "млрд"}` : v >= 1e6 ? `${fmtNum(v / 1e6, 0)} ${LANG === "en" ? "m" : "млн"}` : fmtNum(v, 0);
  const unit = (u) => L.units[u] ?? u;
  const store = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } } };

  const cache = new Map();
  function getJSON(path, optional = false) {
    if (cache.has(path)) return cache.get(path);
    const p = fetch(path, { cache: "no-cache" }).then((r) => { if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`); return r.json(); })
      .catch((e) => { if (optional) return null; throw e; });
    cache.set(path, p);
    return p;
  }

  /* ======================= Ряды ======================= */
  function pointAt(points, iso) { let f = null; for (const p of points) { if (p[0] <= iso) f = p; else break; } return f; }
  function shiftDate(iso, days) { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); }
  function changeOver(points, iso, days) { const a = pointAt(points, iso), b = pointAt(points, shiftDate(iso, -days)); return a && b && b[1] ? (a[1] / b[1] - 1) * 100 : null; }
  const clip = (points, iso) => points.filter((p) => p[0] <= iso);

  /* ======================= Методика: баллы ======================= */
  const scoreOf = (v, better, t) => {
    if (v == null || Number.isNaN(v)) return null;
    if (better === "higher") return v >= t[3] ? 5 : v >= t[2] ? 4 : v >= t[1] ? 3 : v >= t[0] ? 2 : 1;
    return v <= t[0] ? 5 : v <= t[1] ? 4 : v <= t[2] ? 3 : v <= t[3] ? 2 : 1;
  };

  function autoValue(key, date, ctx) {
    const S = ctx.ind?.series || {};
    switch (key) {
      case "policy_rate": { const p = pointAt(S.policy_rate?.points || [], date); return p ? { raw: p[1], text: `${fmtNum(p[1], 1)}%` } : null; }
      case "usd_13w": { const v = changeOver(S.usd?.points || [], date, 91); return v == null ? null : { raw: v, text: fmtPct(v) }; }
      case "reserves_yoy": { const v = changeOver(S.reserves?.points || [], date, 365); return v == null ? null : { raw: v, text: fmtPct(v) }; }
      case "front_week_km2": {
        const pts = (ctx.front?.points || []).filter((p) => p.date <= date);
        if (pts.length < 2) return null;
        const v = pts[pts.length - 1].occupied - pts[pts.length - 2].occupied;
        return { raw: v, text: `${v > 0 ? "+" : v < 0 ? "−" : ""}${fmtNum(Math.abs(v), 0)} ${unit("км²")}` };
      }
      case "lights_drop_count": {
        const w = ctx.lights?.weekly; if (!w) return null;
        const n = Object.entries(w).filter(([k, v]) => !["crimea", "luhansk", "donetsk"].includes(k) && v.change != null && v.change < -10).length;
        return { raw: n, text: `${n} / 22` };
      }
      case "lights_13w": { const v = ctx.lights?.national?.change; return v == null ? null : { raw: v, text: fmtPct(v) }; }
      case "prozorro_noncomp": {
        const p = ctx.proc; if (!p || Math.abs(Date.parse(p.updated) - Date.parse(date)) > 4 * 86400e3) return null;
        const v = p.risk_noncomp_value_share; return v == null ? null : { raw: v, text: `${fmtNum(v, 1)}%` };
      }
    }
    return null;
  }

  /* Считает баллы подпоказателей и сферы; возвращает копию брифинга с d.score (1 знак) */
  function prepare(b, ctx) {
    if (!b) return b;
    const c = JSON.parse(JSON.stringify(b));
    c.domains.forEach((d) => {
      let sw = 0, ss = 0;
      (d.metrics || []).forEach((m) => {
        if (m.auto) { const a = autoValue(m.auto, c.compiled, ctx); m.raw = a ? a.raw : null; m.value = a ? a.text : L.noData; }
        m.score = scoreOf(m.raw, m.better, m.thresholds);
        if (m.score != null) { sw += m.weight; ss += m.weight * m.score; }
      });
      d.score = sw ? Math.round((ss / sw) * 10) / 10 : (d.scoreExpert ?? d.score ?? 3);
    });
    return c;
  }
  const avgScore = (b) => b.domains.reduce((s, d) => s + d.score, 0) / b.domains.length;
  /* Диапазон индекса, если каждый вес сдвинуть на ±20% (перебор комбинаций внутри сферы) */
  function sensitivity(b) {
    let lo = 0, hi = 0;
    b.domains.forEach((d) => {
      const ms = (d.metrics || []).filter((m) => m.score != null);
      if (!ms.length) { lo += d.score; hi += d.score; return; }
      let mn = 5, mx = 1;
      for (let mask = 0; mask < 1 << ms.length; mask++) {
        let sw = 0, ss = 0;
        ms.forEach((m, i) => { const w = m.weight * (mask & (1 << i) ? 1.2 : 0.8); sw += w; ss += w * m.score; });
        const v = ss / sw; mn = Math.min(mn, v); mx = Math.max(mx, v);
      }
      lo += mn; hi += mx;
    });
    return [lo / b.domains.length, hi / b.domains.length];
  }

  /* ======================= Графики ======================= */
  function niceTicks(min, max, count = 4) {
    if (min === max) { min -= 1; max += 1; }
    const span = max - min, raw = span / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) || 10 * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, ticks = [];
    for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
    return ticks;
  }

  function sparkline(points) {
    if (!points || points.length < 2) return "";
    const W = 200, H = 36, ys = points.map((p) => p[1]), min = Math.min(...ys), max = Math.max(...ys), span = max - min || 1;
    const xy = points.map((p, i) => [(i / (points.length - 1)) * (W - 6) + 3, H - 5 - ((p[1] - min) / span) * (H - 10)]);
    const d = xy.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join("");
    const last = xy[xy.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <path d="${d}V${H}H3Z" fill="var(--accent-soft)" opacity=".7"/>
      <path d="${d}" fill="none" stroke="var(--accent)" stroke-width="1.6" vector-effect="non-scaling-stroke"/>
      <circle cx="${last[0]}" cy="${last[1]}" r="2.8" fill="var(--accent)"/></svg>`;
  }

  function lineChart(box, points, { u = "", decimals = 2, step = false } = {}) {
    const W = 560, H = 220, m = { t: 12, r: 14, b: 26, l: 58 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const t0 = Date.parse(points[0][0]), t1 = Date.parse(points[points.length - 1][0]);
    const ys = points.map((p) => p[1]), ticks = niceTicks(Math.min(...ys), Math.max(...ys));
    const y0 = ticks[0], y1 = ticks[ticks.length - 1];
    const X = (iso) => m.l + ((Date.parse(iso) - t0) / (t1 - t0 || 1)) * iw;
    const Y = (v) => m.t + ih - ((v - y0) / (y1 - y0 || 1)) * ih;
    let d = "";
    points.forEach((p, i) => { const x = X(p[0]).toFixed(1), y = Y(p[1]).toFixed(1); d += !i ? `M${x} ${y}` : step ? `H${x}V${y}` : `L${x} ${y}`; });
    const months = [], s = new Date(t0); s.setUTCDate(1); s.setUTCMonth(s.getUTCMonth() + 1);
    for (let t = s; t.getTime() <= t1; t.setUTCMonth(t.getUTCMonth() + 1)) months.push(t.toISOString().slice(0, 10));
    const every = Math.max(1, Math.ceil(months.length / 6)), xLabels = months.filter((_, i) => i % every === 0);
    const last = points[points.length - 1];
    const tickDec = (t) => (Math.abs(t) >= 1000 ? 0 : t % 1 ? 1 : 0);
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img">
      <g class="grid">${ticks.map((t) => `<line x1="${m.l}" x2="${W - m.r}" y1="${Y(t)}" y2="${Y(t)}"/>`).join("")}</g>
      <g class="axis">${ticks.map((t) => `<text x="${m.l - 8}" y="${Y(t) + 3.5}" text-anchor="end">${fmtNum(t, tickDec(t))}</text>`).join("")}
        ${xLabels.map((iso) => { const [y, mo] = iso.split("-"); return `<text x="${X(iso)}" y="${H - 6}" text-anchor="middle">${L.months[+mo - 1]}${mo === "01" ? " " + y.slice(2) : ""}</text>`; }).join("")}</g>
      <path class="area" d="${d}V${m.t + ih}H${m.l}Z" opacity=".6"/>
      <path class="series" d="${d}"/>
      <circle class="end" cx="${X(last[0])}" cy="${Y(last[1])}" r="4.5"/>
      <line class="xhair" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/>
      <circle class="end hov" r="4.5" visibility="hidden"/>
      <rect class="hit" x="${m.l}" y="0" width="${iw}" height="${H}"/>
    </svg><div class="tip" hidden></div>`;
    const svg = $("svg", box), hit = $(".hit", box), xh = $(".xhair", box), hov = $(".hov", box), tip = $(".tip", box);
    const move = (ev) => {
      const r = svg.getBoundingClientRect(), sx = ((ev.clientX - r.left) / r.width) * W, t = t0 + ((sx - m.l) / iw) * (t1 - t0);
      let best = points[0], bd = Infinity;
      for (const p of points) { const dd = Math.abs(Date.parse(p[0]) - t); if (dd < bd) { bd = dd; best = p; } }
      const px = X(best[0]), py = Y(best[1]);
      xh.setAttribute("x1", px); xh.setAttribute("x2", px); xh.setAttribute("visibility", "visible");
      hov.setAttribute("cx", px); hov.setAttribute("cy", py); hov.setAttribute("visibility", "visible");
      tip.hidden = false; tip.textContent = `${fmtDate(best[0])} · ${fmtNum(best[1], decimals)} ${u}`;
      tip.style.left = `${(px / W) * 100}%`; tip.style.top = `${(py / H) * 100}%`;
    };
    hit.addEventListener("pointermove", move); hit.addEventListener("pointerdown", move);
    hit.addEventListener("pointerleave", () => { xh.setAttribute("visibility", "hidden"); hov.setAttribute("visibility", "hidden"); tip.hidden = true; });
  }

  function radar(b, prev, proj) {
    const W = 480, H = 370, cx = W / 2, cy = H / 2 + 4, R = 125, n = b.domains.length;
    const ang = (i) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const pt = (i, v) => [cx + Math.cos(ang(i)) * (R * v) / 5, cy + Math.sin(ang(i)) * (R * v) / 5];
    const poly = (vals) => vals.map((v, i) => pt(i, v).map((x) => x.toFixed(1)).join(",")).join(" ");
    const rings = [1, 2, 3, 4, 5].map((k) => `<polygon class="ring" points="${poly(Array(n).fill(k))}"/>`).join("");
    const spokes = b.domains.map((_, i) => { const [x, y] = pt(i, 5); return `<line class="spoke" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; }).join("");
    const labels = b.domains.map((d, i) => {
      const [x, y] = pt(i, 5.95), c = Math.cos(ang(i)), anchor = Math.abs(c) < 0.25 ? "middle" : c > 0 ? "start" : "end";
      return `<text class="ax" x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}">${esc(L.short[d.id] || d.name)}</text>`;
    }).join("");
    const rv = [1, 3, 5].map((k) => `<text class="rv" x="${cx + 4}" y="${cy - (R * k) / 5 - 3}">${k}</text>`).join("");
    const prevVals = prev ? b.domains.map((d) => (prev.domains.find((x) => x.id === d.id) || d).score) : null;
    const dots = b.domains.map((d, i) => { const [x, y] = pt(i, d.score); return `<circle class="pt ${d.status}" cx="${x}" cy="${y}" r="5" fill="var(--c)"><title>${esc(d.name)}: ${fmtNum(d.score, 1)}/5</title></circle>`; }).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L.profile)}">
      ${rings}${spokes}${rv}
      ${prevVals ? `<polygon class="prev" points="${poly(prevVals)}"/>` : ""}
      ${proj ? `<polygon class="proj" points="${poly(b.domains.map((d) => proj[d.id]))}"/>` : ""}
      <polygon class="cur" points="${poly(b.domains.map((d) => d.score))}"/>
      ${dots}${labels}</svg>`;
  }

  /* ======================= Иконки ======================= */
  const svgI = (d) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const ICON = {
    energy: svgI('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    airdef: svgI('<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>'),
    front: svgI('<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>'),
    army: svgI('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 14.5c2.8 0 6 1.6 6 5.5"/>'),
    economy: svgI('<path d="M3 20h18"/><path d="m4 15 5-5 4 3 7-7"/><path d="M15 6h5v5"/>'),
    finance: svgI('<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6"/><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>'),
    anticorr: svgI('<path d="M12 3v18"/><path d="M5 7h14"/><path d="m5 7-3 7a3 3 0 0 0 6 0z"/><path d="m19 7-3 7a3 3 0 0 0 6 0z"/><path d="M8 21h8"/>'),
    diplomacy: svgI('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>'),
    society: svgI('<circle cx="12" cy="7" r="3"/><circle cx="5" cy="10" r="2"/><circle cx="19" cy="10" r="2"/><path d="M7 20c0-2.8 2.2-5 5-5s5 2.2 5 5"/><path d="M2 19c0-2 1.3-3.5 3-3.8"/><path d="M22 19c0-2-1.3-3.5-3-3.8"/>'),
    up: svgI('<path d="m5 12 5 5L20 7"/>'),
    info: svgI('<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><path d="M12 7.5v.5"/>'),
    shield: svgI('<path d="M4 20h16"/><path d="M6 20v-8l6-4 6 4v8"/><path d="M10 20v-4h4v4"/>'),
    drone: svgI('<circle cx="5" cy="5" r="2.5"/><circle cx="19" cy="5" r="2.5"/><circle cx="5" cy="19" r="2.5"/><circle cx="19" cy="19" r="2.5"/><path d="m7 7 3 3m4 4 3 3m0-10-3 3m-4 4-3 3"/><rect x="10" y="10" width="4" height="4" rx="1"/>'),
    spark: svgI('<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>'),
  };
  const icon = (id) => ICON[id] || "";
  const confBadge = (c) => c ? `<span class="cf cf-${c}" title="${esc(L.conf[c] || c)}">${esc(L.conf[c] || c)}</span>` : "";

  /* ======================= Разделы ======================= */
  function renderScreen(b, prev) {
    const idx = avgScore(b), pIdx = prev ? avgScore(prev) : null;
    const counts = b.domains.reduce((a, d) => ((a[d.status] = (a[d.status] || 0) + 1), a), {});
    const doms = [...b.domains].sort((a, c) => STATUS_ORDER[a.status] - STATUS_ORDER[c.status] || a.score - c.score);
    const delta = pIdx == null ? L.firstWeek : `${idx - pIdx >= 0 ? "+" : "−"}${fmtNum(Math.abs(idx - pIdx), 2)} ${L.vsPrev}`;
    // Полукруглая шкала 1–5
    const R = 120, cx = 160, cy = 150, a0 = Math.PI, frac = Math.max(0, Math.min(1, (idx - 1) / 4));
    const P = (f) => [cx + R * Math.cos(a0 - Math.PI * f), cy - R * Math.sin(a0 - Math.PI * f)];
    const arc = (f) => { const [x, y] = P(f); return `M${cx - R} ${cy} A${R} ${R} 0 ${f > 0.5 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}`; };
    const [kx, ky] = P(frac);
    const ticks = [1, 2, 3, 4, 5].map((v) => { const [x, y] = P((v - 1) / 4).map((z, i) => i ? cy - (cy - z) * 1.2 : cx + (z - cx) * 1.2); return `<text class="g-tick" x="${x}" y="${y + 4}" text-anchor="middle">${v}</text>`; }).join("");
    return `<section id="overview" class="hero reveal">
      <div class="card hero-main">
        <div class="hero-meta"><span class="stamp">${esc(L.stamp)}</span>
          <span class="label">${L.briefNo} ${b.number} · ${esc(b.period)} · ${L.compiled} ${fmtDate(b.compiled)}</span></div>
        <div style="display:grid;gap:16px"><h1>${L.title}</h1><p class="lead">${esc(L.lead)}</p></div>
        <div class="hero-chips">${["crit", "warn", "info", "ok"].filter((s) => counts[s]).map((s) => `<span class="${s}"><i></i>${L.status[s]} <b>${counts[s]}</b></span>`).join("")}</div>
      </div>
      <div class="card gauge">
        <span class="label">${esc(L.index)}</span>
        <svg viewBox="0 0 320 170" aria-hidden="true">
          <defs><linearGradient id="gaugeGrad" x1="0" x2="1"><stop offset="0" stop-color="#ff5f5f"/><stop offset=".45" stop-color="#ffb340"/><stop offset="1" stop-color="#34d399"/></linearGradient></defs>
          <path class="g-track" d="${arc(1)}"/>
          <path class="g-val" d="${arc(frac)}"/>
          ${ticks}
          <circle class="g-knob" cx="${kx.toFixed(1)}" cy="${ky.toFixed(1)}" r="9"/>
        </svg>
        <div class="g-num">${fmtNum(idx, 1)}<small>/ 5</small></div>
        <span class="g-delta">${esc(delta)}</span>
        <span class="g-sens">${esc(L.sens(fmtNum(sensitivity(b)[0], 1), fmtNum(sensitivity(b)[1], 1)))}</span>
        <p class="g-note">${esc(L.indexNote)}</p>
      </div>
      <div class="card strip" style="--n:${doms.length}">
        ${doms.map((d) => `<a class="${d.status}" href="#dom-${d.id}" data-open="${d.id}" title="${esc(d.name)} · ${fmtNum(d.score, 1)}/5">
          <span class="nm">${esc(L.short[d.id] || d.name)}</span><span class="sv">${fmtNum(d.score, 1)}</span>
          <span class="bar" style="--w:${(d.score / 5) * 100}%"></span></a>`).join("")}
      </div>
    </section>`;
  }

  function computeChanges(b, prev) {
    if (!prev) return null;
    const out = [], i1 = avgScore(b), i0 = avgScore(prev);
    if (Math.abs(i1 - i0) >= 0.05) out.push({ dir: i1 > i0 ? "up" : "down", text: `${L.chIndex}: ${fmtNum(i0, 1)} → ${fmtNum(i1, 1)}` });
    b.domains.forEach((d) => {
      const p = prev.domains.find((x) => x.id === d.id); if (!p) return;
      if (Math.abs(d.score - p.score) >= 0.3 || d.status !== p.status) {
        out.push({ dir: d.score >= p.score ? "up" : "down", id: d.id, text: `${d.name}: ${fmtNum(p.score, 1)} → ${fmtNum(d.score, 1)}${d.status !== p.status ? ` · ${L.chStatus}: ${p.statusLabel} → ${d.statusLabel}` : ""}` });
      }
    });
    const old = new Set((prev.corruption?.cases || []).map((c) => c.title));
    (b.corruption?.cases || []).filter((c) => !old.has(c.title)).forEach((c) => out.push({ dir: "down", id: c.sphere, text: `${L.chNewCase}: ${c.title} — ${c.amount}` }));
    const pj = new Map((prev.journal || []).map((j) => [j.rec, j.status]));
    (b.journal || []).forEach((j) => { if (pj.has(j.rec) && pj.get(j.rec) !== j.status) out.push({ dir: j.status === "done" ? "up" : j.status === "failed" ? "down" : "flat", text: `${L.chJournal}: ${j.rec} — ${L.jstatus[j.status]}` }); });
    (b.changes || []).forEach((t) => out.push({ dir: "flat", text: t }));
    return out;
  }

  function trendCard(b, all, hist) {
    const pts = [...(hist?.points || []).map((p) => ({ date: p.date, v: Object.values(p.domains).reduce((a, x) => a + x, 0) / Object.keys(p.domains).length, rec: true, basis: p.basis?.[LANG] })),
      ...all.filter((x) => x.id <= b.id).map((x) => ({ date: x.compiled, v: avgScore(x), rec: false }))].sort((a, c) => a.date.localeCompare(c.date));
    if (pts.length < 2) return "";
    const W = 480, H = 170, m = { l: 30, r: 16, t: 16, b: 26 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    const t0 = Date.parse(pts[0].date), t1 = Date.parse(pts[pts.length - 1].date);
    const X = (d) => m.l + ((Date.parse(d) - t0) / (t1 - t0 || 1)) * iw, Y = (v) => m.t + ih - ((v - 1) / 4) * ih;
    const seg = (a) => a.map((p, i) => `${i ? "L" : "M"}${X(p.date).toFixed(1)} ${Y(p.v).toFixed(1)}`).join("");
    const firstReal = pts.findIndex((p) => !p.rec);
    const recPart = firstReal > 0 ? pts.slice(0, firstReal + 1) : [], realPart = firstReal >= 0 ? pts.slice(firstReal) : [];
    const last = pts[pts.length - 1];
    return `<div class="card trend"><div class="sec-head"><h3>${esc(L.trendTitle)}</h3><span class="label">${esc(L.trendNote)}</span></div>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L.trendTitle)}">
        <defs><linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#5b9cff" stop-opacity=".28"/><stop offset="1" stop-color="#5b9cff" stop-opacity="0"/></linearGradient></defs>
        ${[1, 2, 3, 4, 5].map((v) => `<line class="tg" x1="${m.l}" x2="${W - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text class="tt" x="${m.l - 8}" y="${Y(v) + 3.5}" text-anchor="end">${v}</text>`).join("")}
        <path d="${seg(pts)}V${m.t + ih}H${X(pts[0].date)}Z" fill="url(#trendFill)"/>
        ${recPart.length > 1 ? `<path class="tl rec" d="${seg(recPart)}"/>` : ""}
        ${realPart.length > 1 ? `<path class="tl" d="${seg(realPart)}"/>` : ""}
        ${pts.map((p) => `<circle class="tp ${p.rec ? "rec" : ""}" cx="${X(p.date)}" cy="${Y(p.v)}" r="${p === last ? 6 : 4}"><title>${fmtDate(p.date)} · ${fmtNum(p.v, 1)}${p.basis ? " — " + esc(p.basis) : ""}</title></circle>`).join("")}
        ${pts.map((p) => `<text class="tx" x="${X(p.date)}" y="${H - 6}" text-anchor="middle">${L.months[+p.date.slice(5, 7) - 1]}</text>`).join("")}
        <text class="tv" x="${X(last.date) - 8}" y="${Y(last.v) - 12}" text-anchor="end">${fmtNum(last.v, 1)}</text>
      </svg></div>`;
  }

  function renderOverview(b, prev, all, hist) {
    const ch = computeChanges(b, prev);
    return `<section><div class="overview">
      <div class="card headlines"><h2>${esc(L.headlines)}</h2>
        ${b.headline.map((h, i) => `<div class="hl ${h.level}"><span class="hl-n">${i + 1}</span><div><b>${esc(h.title)}</b><p>${esc(h.text)}</p></div></div>`).join("")}
      </div>
      <div class="side">
        <div class="card radar-card">
          <div class="sec-head"><h2>${esc(L.profile)}</h2><span class="label">1–5</span></div>
          <div class="radar">${radar(b, prev)}</div>
          <div class="legend"><span><i></i>${esc(L.thisWeek)}</span>${prev ? `<span><i class="dash"></i>${esc(L.prevWeek)}</span>` : ""}</div>
        </div>
        ${trendCard(b, all, hist)}
        <div class="card changes"><h3>${esc(L.changes)}</h3>
          ${ch == null ? `<p class="muted">${esc(L.changesFirst)}</p>` : ch.length ? `<ul>${ch.map((c) => `<li class="ch-${c.dir}">${c.id ? icon(c.id) : ""}<span>${esc(c.text)}</span></li>`).join("")}</ul>` : `<p class="muted">—</p>`}
        </div>
      </div>
    </div></section>`;
  }

  function renderTiles(b, all) {
    const doms = [...b.domains].sort((a, c) => STATUS_ORDER[a.status] - STATUS_ORDER[c.status] || a.score - c.score);
    const past = all.filter((x) => x.id <= b.id).slice(-10);
    const history = past.length > 1 ? `<div class="card history"><table>
        <thead><tr><th>${esc(L.sphere)}</th>${past.map((x) => `<th class="num">${x.id.slice(8, 10)}.${x.id.slice(5, 7)}</th>`).join("")}</tr></thead>
        <tbody>${b.domains.map((d) => `<tr><td>${esc(d.name)}</td>${past.map((x) => { const dd = x.domains.find((y) => y.id === d.id); return `<td>${dd ? `<span class="hcell ${dd.status}" title="${esc(dd.statusLabel)} · ${fmtNum(dd.score, 1)}/5"></span>` : "—"}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`
      : `<p class="label" style="text-transform:none;letter-spacing:0">${esc(L.historyNote)}</p>`;
    return `<section id="spheres">
      <div class="sec-head"><h2>${esc(L.spheres)}</h2><span class="label">${esc(L.spheresSub)}</span></div>
      <div class="tiles">${doms.map((d) => `<a class="card tile ${d.status}" href="#dom-${d.id}" data-open="${d.id}">
        <div class="tile-top"><span class="tile-n"><span class="dico">${icon(d.id)}</span><span class="nm">${esc(d.name)}</span></span><span class="pill">${esc(d.statusLabel)}</span></div>
        <div class="tile-bot"><span class="scorebar">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= Math.round(d.score) ? "on" : ""}"></i>`).join("")}<b>${fmtNum(d.score, 1)}/5</b></span>
        <span class="trend ${d.trend}">${L.trend[d.trend]}</span></div></a>`).join("")}</div>
      ${history}
      ${renderCompare(b, all)}
    </section>`;
  }

  function renderCompare(b, all) {
    const others = all.filter((x) => x.id !== b.id);
    if (!others.length) return `<p class="label" style="text-transform:none;letter-spacing:0">${esc(L.compareNone)}</p>`;
    const c = others.find((x) => x.id === state.cmp) || others.filter((x) => x.id < b.id).pop() || others[0];
    return `<div class="card cmp"><div class="sec-head"><h3>${esc(L.compare)}</h3>
        <select id="cmp-select" aria-label="${esc(L.compare)}">${others.map((x) => `<option value="${x.id}" ${x.id === c.id ? "selected" : ""}>${L.briefNo} ${x.number} · ${esc(x.period)}</option>`).join("")}</select></div>
      <div class="tablebox"><table class="mtab"><thead><tr><th>${esc(L.sphere)}</th><th>${L.briefNo} ${c.number}</th><th>${L.briefNo} ${b.number}</th><th>${esc(L.delta)}</th></tr></thead><tbody>
      ${b.domains.map((d) => { const o = c.domains.find((x) => x.id === d.id); const dl = o ? d.score - o.score : 0;
        return `<tr><td>${esc(d.name)}</td><td class="num">${o ? fmtNum(o.score, 1) : "—"}</td><td class="num">${fmtNum(d.score, 1)}</td>
        <td class="num ${dl > 0.05 ? "up" : dl < -0.05 ? "down" : ""}">${dl > 0 ? "+" : dl < 0 ? "−" : ""}${fmtNum(Math.abs(dl), 1)}</td></tr>`; }).join("")}
      <tr class="tot"><td><b>${esc(L.index)}</b></td><td class="num">${fmtNum(avgScore(c), 2)}</td><td class="num">${fmtNum(avgScore(b), 2)}</td><td class="num">${fmtNum(avgScore(b) - avgScore(c), 2)}</td></tr>
      </tbody></table></div></div>`;
  }

  function renderMarkets(b, ctx) {
    const S = ctx.ind.series, at = b.compiled, tiles = [];
    const tile = (key, decimals, sub) => {
      const s = S[key]; if (!s) return; const p = pointAt(s.points, at); if (!p) return;
      const { text, dir } = sub(s.points);
      tiles.push(`<div class="card kpi"><span class="label">${esc(L.series[key])}<span class="tag">${L.auto}</span></span>
        <span class="v">${fmtNum(p[1], decimals)} <small>${esc(unit(s.unit))}</small></span>
        <span class="s ${dir}">${text}</span>${sparkline(clip(s.points, at).slice(key === "reserves" ? -24 : -120))}
        <span class="src">${esc(L.src[s.source] || s.source)}</span></div>`);
    };
    const fx = (pts) => { const w = changeOver(pts, at, 7), q = changeOver(pts, at, 91); return { text: `${fmtPct(w)} ${L.perWeek} · ${fmtPct(q)} ${L.per3m}`, dir: q > 1 ? "bad" : q < -1 ? "good" : "" }; };
    tile("usd", 2, fx); tile("eur", 2, fx);
    tile("policy_rate", 1, (pts) => { const p = clip(pts, at), prev = [...p].reverse().find((x) => x[1] !== p[p.length - 1][1]); return { text: prev ? `${L.was} ${fmtNum(prev[1], 1)}% · ${L.changedAfter} ${fmtDate(prev[0])}` : L.unchanged, dir: "" }; });
    tile("reserves", 2, (pts) => { const y = changeOver(pts, at, 365); return { text: `${fmtPct(y)} ${L.perYear}`, dir: y < -3 ? "bad" : y > 3 ? "good" : "" }; });

    const series = { ...S };
    if (ctx.front?.points?.length) series.front = { unit: "км²", source: "DeepState", points: ctx.front.points.map((p) => [p.date, p.occupied]) };
    const charts = [["front", 0, false, 120], ["usd", 2, false, 365], ["eur", 2, false, 365], ["reserves", 1, false, 1100], ["policy_rate", 1, true, 730]]
      .filter(([k]) => series[k]).map(([k, dec, step, days]) => {
        const pts = clip(series[k].points, at).filter((p) => p[0] >= shiftDate(at, -days)), last = pts[pts.length - 1];
        return `<div class="card chart ${k === "front" ? "wide" : ""}"><div class="chart-head"><div><h3>${esc(L.series[k])}<span class="tag">${L.auto}</span></h3><span class="label">${esc(L.chartSpan[k])}</span></div>
          <span class="now">${last ? fmtNum(last[1], dec) + " " + esc(unit(series[k].unit)) : ""}</span></div>
          <div class="chart-box" data-series="${k}" data-dec="${dec}" data-step="${step}" data-days="${days}"></div>
          <span class="chart-foot">${L.source}: ${esc(L.src[series[k].source] || series[k].source)} · ${esc(L.hover)}</span></div>`;
      }).join("");
    ctx._series = series;

    const manual = b.kpis.map((k) => `<div class="card kpi"><span class="label">${esc(k.label)}</span>
      <span class="v">${esc(k.value)}${k.unverified ? `<span class="unv">${L.unverified}</span>` : ""}</span>
      <span class="s ${k.dir === "good" ? "good" : k.dir === "bad" ? "bad" : ""}">${esc(k.sub)}</span>
      <span class="src">${esc(k.source)} ${confBadge(k.conf)}</span></div>`).join("");

    return `<section id="markets">
      <div class="sec-head"><h2>${esc(L.weekKpis)}</h2><span class="label">${esc(L.weekKpisSub)}</span></div>
      <div class="kpis kpis-wide">${manual}</div>
      <div class="sec-head" style="margin-top:18px"><h2>${esc(L.markets)}</h2><span class="label">${esc(L.marketsSub)} · ${L.on} ${fmtDate(at)}</span></div>
      <div class="kpis">${tiles.join("")}</div>
      ${renderSignals(b, ctx)}
      <div class="charts">${charts}</div>
    </section>`;
  }

  function renderRec(r) {
    const rows = [[L.what, r.what], [L.cost, r.cost], [L.metric, r.metric]].filter(([, v]) => v);
    return `<div class="rec"><div class="rec-top"><span class="lever">${esc(r.lever)}</span><span class="prop">${esc(L.proposal)}</span></div>
      <span class="t">${esc(r.title)}</span>
      ${rows.length ? `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>` : ""}
      ${r.effect ? `<div class="effect"><span class="effect-h">${ICON.up}${esc(L.effect)}</span><p>${esc(r.effect)}</p></div>` : ""}</div>`;
  }
  const disclaimer = () => `<div class="disclaimer">${ICON.info}<p>${esc(L.disclaimer)}</p></div>`;

  const corrFor = (b, id) => (b.corruption?.spheres || []).find((s) => s.id === id);
  const riskBar = (r) => [1, 2, 3, 4, 5].map((i) => `<i class="${i <= r ? "on" : ""}"></i>`).join("");

  function metricTable(d) {
    if (!d.metrics?.length) return "";
    return `<details class="mt"><summary><span class="label">${esc(L.scoreHow)}</span><b>${fmtNum(d.score, 1)}/5</b><span class="chev">›</span></summary>
      <div class="tablebox"><table class="mtab"><thead><tr>${L.mCols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>
      ${d.metrics.map((m) => `<tr><td>${esc(m.label)}<div class="muted">${m.better === "higher" ? "↑" : "↓"} ${m.thresholds.map((t) => fmtNum(t, t % 1 ? 1 : 0)).join(" · ")}</div></td>
        <td class="num">${esc(m.value)}</td><td>${m.score == null ? "—" : `<span class="sc s${m.score}">${m.score}</span>`}</td>
        <td class="num">${Math.round(m.weight * 100)}%</td><td>${confBadge(m.conf)}<div class="muted">${esc(m.source)}</div></td></tr>`).join("")}
      </tbody></table></div></details>`;
  }

  function renderDomains(b) {
    const counts = b.domains.reduce((a, d) => ((a[d.status] = (a[d.status] || 0) + 1), a), {});
    const chips = [["all", L.all, b.domains.length], ...["crit", "warn", "info", "ok"].filter((s) => counts[s]).map((s) => [s, L.status[s], counts[s]])];
    const doms = [...b.domains].sort((a, c) => STATUS_ORDER[a.status] - STATUS_ORDER[c.status]);
    return `<section id="domains">
      <div class="sec-head"><h2>${esc(L.domains)}</h2><span class="label">${esc(L.domainsSub)}</span></div>
      ${disclaimer()}
      <div class="filters" role="group">${chips.map(([k, n, c], i) => `<button class="chip ${k === "all" ? "" : k}" type="button" id="f-${k}" data-filter="${k}" aria-pressed="${i === 0}">${k === "all" ? "" : "<i></i>"}${esc(n)}<span class="n">${c}</span></button>`).join("")}</div>
      <div class="domains">${doms.map((d) => { const c = corrFor(b, d.id); return `<article class="card dom ${d.status}" id="dom-${d.id}" data-status="${d.status}">
        <details ${d.status === "crit" ? "open" : ""}>
          <summary><span class="sum-l"><span class="dico">${icon(d.id)}</span><h2>${esc(d.name)}</h2><span class="pill">${esc(d.statusLabel)}</span></span>
            <span class="sum-r"><span class="scorebar">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= Math.round(d.score) ? "on" : ""}"></i>`).join("")}<b>${fmtNum(d.score, 1)}</b></span>
            <span class="trend ${d.trend}">${L.trend[d.trend]}</span><span class="label">${d.recs.length} ${L.nDec}</span><span class="chev">›</span></span></summary>
          <div class="dom-body">
            <div class="cols"><div><span class="label">${L.situation}</span><ul class="facts">${d.situation.map((s) => `<li>${esc(s)}</li>`).join("")}</ul></div>
              <div><span class="label">${L.diagnosis}</span><p class="diag">${esc(d.diagnosis)}</p></div></div>
            ${metricTable(d)}
            ${c ? `<a class="corr-link" href="#corr-${d.id}">${icon("anticorr")}<span>${esc(L.corrRisk)}: <b>${c.risk}/5</b></span><span class="risk r${c.risk}">${riskBar(c.risk)}</span><span class="corr-link-t">${esc(c.without)}</span></a>` : ""}
            <div style="display:grid;gap:8px"><span class="label">${L.decisions}</span><div class="recs">${d.recs.map(renderRec).join("")}</div></div>
          </div></details></article>`; }).join("")}</div>
    </section>`;
  }

  /* ---------- Что если ---------- */
  function allProposals(b) {
    const list = [];
    b.domains.forEach((d) => d.recs.forEach((r, i) => list.push({ key: `${d.id}:${i}`, group: d.id, groupName: d.name, r })));
    (b.corruption?.recs || []).forEach((r, i) => list.push({ key: `corr:${i}`, group: "corr", groupName: L.corrGroup, r }));
    return list;
  }
  function projectScores(b, sel) {
    // Убывающая отдача: чем ближе сфера к 5, тем меньше даёт каждое следующее предложение
    const sum = Object.fromEntries(b.domains.map((d) => [d.id, 0]));
    allProposals(b).forEach((p) => { if (sel.has(p.key)) Object.entries(p.r.impact || {}).forEach(([k, v]) => { if (k in sum) sum[k] += v; }); });
    return Object.fromEntries(b.domains.map((d) => {
      const g = (5 - d.score) * (1 - Math.exp(-sum[d.id] / 3));
      return [d.id, Math.round((d.score + g) * 10) / 10];
    }));
  }
  function storyVisual(key, b, ctx) {
    const R = b.russia, idx = avgScore(b);
    if (key === "index") return `<div class="sv-index"><span class="label">${esc(L.index)}</span><div class="sv-num">${fmtNum(idx, 1)}<small>/ 5</small></div>
      <div class="sv-bars">${[...b.domains].sort((a, c) => a.score - c.score).map((d) => `<div class="${d.status}"><span>${esc(L.short[d.id])}</span><i style="--w:${d.score / 5 * 100}%"></i><b>${fmtNum(d.score, 1)}</b></div>`).join("")}</div></div>`;
    if (key.startsWith("domain:")) {
      const d = b.domains.find((x) => x.id === key.slice(7)); if (!d) return "";
      return `<div class="sv-dom ${d.status}"><div class="sv-dh"><span class="dico">${icon(d.id)}</span><b>${esc(d.name)}</b><span class="pill">${esc(d.statusLabel)}</span></div>
        <div class="sv-num">${fmtNum(d.score, 1)}<small>/ 5</small></div>
        <ul>${(d.metrics || []).map((m) => `<li><span>${esc(m.label)}</span><b>${esc(m.value)}</b>${m.score ? `<span class="sc s${m.score}">${m.score}</span>` : ""}</li>`).join("")}</ul></div>`;
    }
    if (key === "map") return `<div class="sv-map">${mapSvg(b, ctx, "status", null, true)}<span class="label">${esc(L.occupied)}</span></div>`;
    if (key === "russia" && R) return `<div class="sv-ru">${R.kpis.slice(0, 4).map((k) => `<div class="${k.dir === "bad" ? "crit" : k.dir === "good" ? "ok" : "info"}"><span class="label">${esc(k.label)}</span><b>${esc(k.value)}</b><span>${esc(k.sub)}</span></div>`).join("")}</div>`;
    if (key === "scenarios" && b.scenarios) return `<div class="sv-sc">${[...b.scenarios].sort((a, c) => c.prob - a.prob).map((s) => `<div class="${{ base: "info", pess: "crit", opt: "ok" }[s.id]}"><span>${esc(s.name)}</span><i style="--w:${s.prob * 100}%"></i><b>${Math.round(s.prob * 100)}%</b></div>`).join("")}</div>`;
    return "";
  }

  function renderStory(b, ctx) {
    if (!b.story?.length) return "";
    return `<section id="story" class="story">
      <div class="sec-head"><h2>${esc(L.storyTitle)}</h2><span class="label">${esc(L.storySub)}</span></div>
      <div class="story-grid">
        <div class="story-steps">${b.story.map((s, i) => `<article class="step card" data-step="${i}"><span class="step-n">${String(i + 1).padStart(2, "0")}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>
          <div class="step-vis-m">${storyVisual(s.visual, b, ctx)}</div></article>`).join("")}</div>
        <div class="story-stage"><div class="card stage-in" id="stage">${storyVisual(b.story[0].visual, b, ctx)}</div></div>
      </div>
    </section>`;
  }

  function wireStory(app, b, ctx) {
    const stage = $("#stage", app); if (!stage || !("IntersectionObserver" in window)) return;
    if (state.storyObs) state.storyObs.disconnect();
    let cur = 0;
    const steps = [...app.querySelectorAll(".step")];
    steps[0]?.classList.add("on");
    state.storyObs = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      const i = +e.target.dataset.step; if (i === cur) return;
      cur = i; steps.forEach((s) => s.classList.toggle("on", s === e.target));
      stage.classList.add("swap");
      setTimeout(() => { stage.innerHTML = storyVisual(b.story[i].visual, b, ctx); stage.classList.remove("swap"); }, 160);
    }), { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => state.storyObs.observe(s));
  }

  /* ---------- Трекер решений ---------- */
  function renderDecisions(b, all) {
    const list = all.filter((x) => x.id <= b.id).flatMap((x) => x.decisions || []);
    const seen = new Set(), uniq = list.filter((d) => { const k = d.date + d.title; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, c) => c.date.localeCompare(a.date));
    if (!uniq.length) return "";
    const cls = { adopted: "ok", signed: "ok", pending: "warn", rejected: "crit", vetoed: "crit" };
    return `<section id="decisions">
      <div class="sec-head"><h2>${esc(L.decisions)}</h2><span class="label">${esc(L.decisionsSub)}</span></div>
      <div class="card dec-list">${uniq.map((d) => `<div class="dec ${cls[d.status] || "info"}">
        <span class="dec-date mono">${fmtDate(d.date)}</span>
        <span class="dico sm" style="--c:var(--accent);--cb:var(--accent-soft)">${icon(d.sphere)}</span>
        <div class="dec-body"><a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.title)}</a><span class="muted">${esc(d.body)}</span></div>
        <span class="pill">${esc(L.dstatus[d.status] || d.status)}</span></div>`).join("")}</div>
    </section>`;
  }

  /* ---------- Медиа и ночная яркость ---------- */
  function renderSignals(b, ctx) {
    const M = ctx.media?.spheres, Lt = ctx.lights;
    if (!M && !Lt?.national) return "";
    const max = M ? Math.max(...Object.values(M).map((x) => x.week), 1) : 1;
    const media = M ? `<div class="card media"><div class="sec-head"><h3>${esc(L.media)}<span class="tag">${L.auto}</span></h3><span class="label">${esc(L.mediaSub)}</span></div>
      <div class="mbars">${b.domains.filter((d) => M[d.id]).sort((a, c) => M[c.id].week - M[a.id].week).map((d) => { const m = M[d.id];
        const tc = m.tone == null ? "" : m.tone < -3 ? "crit" : m.tone < -1 ? "warn" : "ok";
        return `<div class="mb"><span class="mb-n">${esc(L.short[d.id])}</span><span class="mb-t"><i style="width:${m.week / max * 100}%"></i></span>
          <span class="mono mb-v">${fmtNum(m.week, 0)}</span><span class="mono mb-c ${m.change > 0 ? "up" : m.change < 0 ? "down" : ""}">${fmtPct(m.change)}</span>
          <span class="mb-tone ${tc}" title="${esc(L.tone)} ${m.tone ?? "—"}">${m.tone == null ? "—" : fmtNum(m.tone, 1)}</span></div>`; }).join("")}</div>
      <p class="basis">${esc(L.toneNote)}</p></div>` : "";
    const n = Lt?.national;
    const lights = n ? `<div class="card kpi lights"><span class="label">${esc(L.lights)}<span class="tag">${L.auto}</span></span>
      <span class="v">${fmtPct(n.change)}</span><span class="s ${n.change < -3 ? "bad" : n.change > 3 ? "good" : ""}">${esc(L.lightsSub)}</span>
      ${Lt.series?.length > 1 ? sparkline(Lt.series) : ""}<span class="src">NASA Black Marble · ${confBadge("estimate")}</span>
      <p class="basis">${esc(L.lightsNote)}</p></div>` : "";
    return `<div class="signals">${lights}${media}</div>`;
  }

  function renderScenarios(b) {
    if (!b.scenarios?.length) return "";
    const cls = { base: "info", pess: "crit", opt: "ok" };
    const order = { pess: 0, base: 1, opt: 2 };
    return `<div class="sec-head"><h3 class="h3big">${esc(L.scenTitle)}</h3><span class="label">${esc(L.scenSub)}</span></div>
      <div class="scen">${[...b.scenarios].sort((a, c) => order[a.id] - order[c.id]).map((s) => `<div class="card sc-card ${cls[s.id] || "info"}">
        <div class="sc-top"><b>${esc(s.name)}</b><span class="sc-p">${Math.round(s.prob * 100)}%</span></div>
        <span class="sc-bar"><i style="width:${s.prob * 100}%"></i></span>
        <span class="label">${esc(L.scenIdx)} ${fmtNum(s.index[0], 1)}–${fmtNum(s.index[1], 1)}</span>
        <p>${esc(s.text)}</p>
        <span class="label">${esc(L.scenTrig)}</span><ul>${(s.triggers || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>
      <div style="height:6px"></div>`;
  }

  function renderRussia(b) {
    const R = b.russia; if (!R) return "";
    return `<section id="russia">
      <div class="sec-head"><h2>${esc(L.russia)}</h2><span class="label">${esc(L.russiaSub)}</span></div>
      <p class="muted lead2">${esc(R.lead)}</p>
      <div class="kpis kpis-wide">${R.kpis.map((k) => `<div class="card kpi"><span class="label">${esc(k.label)}</span>
        <span class="v">${esc(k.value)}</span><span class="s ${k.dir === "good" ? "good" : k.dir === "bad" ? "bad" : ""}">${esc(k.sub)}</span>
        <span class="src">${esc(k.source)} ${confBadge(k.conf)}</span></div>`).join("")}</div>
      ${R.note ? `<div class="disclaimer">${ICON.info}<p>${esc(R.note)}</p></div>` : ""}
    </section>`;
  }

  function renderWhatIf(b) {
    const groups = {};
    allProposals(b).forEach((p) => { (groups[p.group] ||= { name: p.groupName, items: [] }).items.push(p); });
    return `<section id="whatif">
      <div class="sec-head"><h2>${esc(L.whatif)}</h2><span class="label">${esc(L.whatifSub(b.horizon || "3"))}</span></div>
      ${renderScenarios(b)}
      <p class="muted lead2">${esc(L.whatifLead)}</p>
      <div class="wi">
        <div class="card wi-list">
          <div class="wi-tools"><button type="button" class="btn" id="wi-all">${esc(L.selAll)}</button><button type="button" class="btn ghost" id="wi-none">${esc(L.selNone)}</button><span class="label" id="wi-count"></span></div>
          ${Object.entries(groups).map(([g, grp]) => `<fieldset><legend><span class="dico sm">${icon(g === "corr" ? "anticorr" : g)}</span>${esc(grp.name)}</legend>
            ${grp.items.map((p) => `<label class="wi-item"><input type="checkbox" id="wi-${p.key.replace(":", "-")}" data-key="${p.key}"><span>${esc(p.r.title)}
              <em>${Object.entries(p.r.impact || {}).map(([k, v]) => `${esc(L.short[k] || k)} +${fmtNum(v, 1)}`).join(" · ")}</em></span></label>`).join("")}
          </fieldset>`).join("")}
        </div>
        <div class="card wi-out" id="wi-out"></div>
      </div>
    </section>`;
  }
  function updateWhatIf(b) {
    const out = $("#wi-out"); if (!out) return;
    const proj = projectScores(b, state.sim), cur = avgScore(b);
    const pIdx = Object.values(proj).reduce((a, v) => a + v, 0) / b.domains.length;
    $("#wi-count").textContent = `${state.sim.size} ${L.selected}`;
    out.innerHTML = `<div class="wi-idx"><span class="label">${esc(L.index)}</span>
        <div class="index-row"><span class="wi-num">${fmtNum(cur, 1)}</span><span class="wi-arrow">→</span><span class="wi-num proj">${fmtNum(pIdx, 1)}</span><span class="wi-d">${pIdx > cur ? "+" : ""}${fmtNum(pIdx - cur, 1)}</span></div></div>
      <div class="radar">${radar(b, null, state.sim.size ? proj : null)}</div>
      <div class="legend"><span><i></i>${esc(L.thisWeek)}</span><span><i class="proj"></i>${esc(L.projected)}</span></div>
      <div class="wi-bars">${b.domains.map((d) => `<div class="wb"><span>${esc(L.short[d.id])}</span>
        <span class="wb-track"><i class="wb-cur ${d.status}" style="width:${(d.score / 5) * 100}%"></i><i class="wb-add" style="left:${(d.score / 5) * 100}%;width:${((proj[d.id] - d.score) / 5) * 100}%"></i></span>
        <b>${fmtNum(d.score, 1)}${proj[d.id] > d.score ? ` → ${fmtNum(proj[d.id], 1)}` : ""}</b></div>`).join("")}</div>`;
  }

  /* ---------- Карта ---------- */
  function regionProc(proc, r) {
    if (!proc?.regions) return null;
    const key = r[6];
    const hit = Object.entries(proc.regions).find(([name]) => key === "@kyivcity" ? /^(м\.\s*)?Київ$|^місто Київ$/i.test(name.trim()) : name.startsWith(key));
    return hit ? hit[1] : null;
  }
  /* Проекция: равнопромежуточная с поправкой на широту */
  const MAP = { lon0: 22, lat1: 52.45, kx: 0.6626, k: 41.5 };
  const mx = (lon) => (lon - MAP.lon0) * MAP.kx * MAP.k, my = (lat) => (MAP.lat1 - lat) * MAP.k;
  const pathOf = (polys) => polys.map((p) => "M" + p.map(([x, y]) => `${mx(x).toFixed(1)} ${my(y).toFixed(1)}`).join("L") + "Z").join("");

  function regionValue(layer, r, b, ctx) {
    const st = b.regions?.[r[0]] || "rear", p = regionProc(ctx.proc, r);
    if (layer === "status") return { cls: `rs-${st}`, tip: L.regStatus[st] };
    if (layer === "lights") {
      const c = ctx.lights?.weekly?.[r[0]]?.change;
      if (c == null || ["crimea", "luhansk", "donetsk"].includes(r[0])) return { cls: "nd", tip: L.noData };
      const q = c <= -25 ? "d4" : c <= -12 ? "d3" : c <= -4 ? "d2" : c < 4 ? "d1" : "d0";
      return { cls: q, tip: fmtPct(c), val: fmtPct(c) };
    }
    if (layer === "alerts") { const h = ctx.alerts?.regions?.[r[0]]; return h == null ? { cls: "nd", tip: L.noData } : { cls: `q${Math.min(4, Math.floor(h / 30))}`, tip: `${fmtNum(h, 0)} ${LANG === "en" ? "h" : "ч"}`, val: fmtNum(h, 0) }; }
    if (layer === "noncomp") { const s = p && p.total ? (p.noncomp / p.total) * 100 : null; return s == null ? { cls: "nd", tip: L.noData } : { cls: `q${Math.min(4, Math.floor(s / 15))}`, tip: `${fmtNum(s, 1)}%`, val: `${fmtNum(s, 0)}%` }; }
    const max = Math.max(...REGIONS.map((rr) => regionProc(ctx.proc, rr)?.total || 0), 1);
    return p ? { cls: `q${Math.min(4, Math.floor(Math.sqrt((p.total || 0) / max) * 5))}`, tip: fmtNum(p.total, 0), val: fmtNum(p.total, 0) } : { cls: "nd", tip: L.noData };
  }

  function mapSvg(b, ctx, layer, frameIdx, small) {
    const ob = ctx.oblasts?.oblasts || {}, frames = ctx.frontline?.frames || [];
    const f = frames[frameIdx ?? frames.length - 1];
    const W = Math.round(mx(40.3)), H = Math.round(my(44.3));
    const shapes = REGIONS.filter((r) => ob[r[0]]).map((r) => {
      const v = regionValue(layer, r, b, ctx);
      return `<path class="ob ${v.cls}" fill-rule="evenodd" d="${pathOf(ob[r[0]])}"><title>${esc(regName(r))}: ${esc(v.tip)}</title></path>`;
    }).join("");
    const occ = f ? `<path class="occ" d="${pathOf(f.occupied)}"/>` : "";
    const kc = ctx.oblasts?.kyiv_city;
    const labels = small ? "" : REGIONS.filter((r) => ob[r[0]]).map((r) => {
      const pts = ob[r[0]].reduce((a, p) => (p.length > a.length ? p : a), []);
      const cx = pts.reduce((s, q) => s + q[0], 0) / pts.length, cy = pts.reduce((s, q) => s + q[1], 0) / pts.length;
      const v = regionValue(layer, r, b, ctx);
      return v.val ? `<text class="ol" x="${mx(cx).toFixed(0)}" y="${my(cy).toFixed(0)}" text-anchor="middle">${esc(v.val)}</text>` : "";
    }).join("");
    return `<svg class="umap" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L.map)}">
      <defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="rgba(255,95,95,.32)"/><line x1="0" y1="0" x2="0" y2="6" stroke="rgba(255,120,120,.95)" stroke-width="2.4"/></pattern></defs>
      <g>${shapes}</g><g id="occ-layer">${occ}</g>
      ${kc ? `<circle class="kyiv" cx="${mx(kc[0])}" cy="${my(kc[1])}" r="${small ? 3 : 4.5}"><title>${esc(regName(REGIONS.find((r) => r[0] === "kyiv")))}</title></circle>` : ""}
      ${labels}</svg>`;
  }

  function renderMap(b, ctx) {
    if (ctx.oblasts?.oblasts) {
      const layer = state.layer || "status", frames = ctx.frontline?.frames || [];
      const fi = state.frame ?? frames.length - 1;
      const legend = layer === "status"
        ? ["occupied", "partial", "front", "rear"].map((s) => `<span><i class="rs-${s}"></i>${esc(L.regStatus[s])}</span>`).join("")
        : layer === "lights"
          ? `<span class="grad"><i class="d4"></i><i class="d3"></i><i class="d2"></i><i class="d1"></i><i class="d0"></i></span><span>−25% … 0 … +</span><span><i class="nd"></i>${esc(L.noData)}</span>`
          : `<span class="grad"><i class="q0"></i><i class="q1"></i><i class="q2"></i><i class="q3"></i><i class="q4"></i></span><span>↑</span><span><i class="nd"></i>${esc(L.noData)}</span>`;
      const procOk = !!ctx.proc;
      return `<section id="map">
        <div class="sec-head"><h2>${esc(L.map)}</h2><span class="label">${esc(L.mapSub)}</span></div>
        <div class="card mapcard">
          <div class="seg map-seg" role="group">${Object.entries(L.layers).map(([k, tt]) => `<button type="button" id="layer-${k}" data-layer="${k}" aria-pressed="${k === layer}" ${((k === "noncomp" || k === "volume") && !procOk) || (k === "alerts" && !ctx.alerts) || (k === "lights" && !ctx.lights) ? "disabled" : ""}>${esc(tt)}</button>`).join("")}</div>
          <div class="map-wrap" id="map-wrap">${mapSvg(b, ctx, layer, fi)}</div>
          ${frames.length > 1 ? `<div class="timeline"><button type="button" class="btn ghost" id="map-play">${esc(L.mapPlay)}</button>
            <input type="range" id="map-frame" min="0" max="${frames.length - 1}" value="${fi}" aria-label="${esc(L.week)}">
            <span class="mono" id="map-date">${fmtDate(frames[fi].date)} · ${fmtNum((ctx.front?.points || [])[fi]?.occupied || 0, 0)} ${unit("км²")}</span></div>` : ""}
          <div class="map-legend">${legend}<span><i class="occ-k"></i>${esc(L.occupied)}</span></div>
          <p class="basis">${esc(L.mapNote)}${layer === "lights" ? " " + esc(L.lightsNote) : ""}</p>
        </div>
      </section>`;
    }
    return renderTileMap(b, ctx);
  }

  function wireMap(app, ctx, b) {
    const frames = ctx.frontline?.frames || [];
    const rng = $("#map-frame"), lbl = $("#map-date"), play = $("#map-play");
    const setFrame = (i) => {
      state.frame = i;
      const g = $("#occ-layer"); if (g) g.innerHTML = `<path class="occ" d="${pathOf(frames[i].occupied)}"/>`;
      if (lbl) lbl.textContent = `${fmtDate(frames[i].date)} · ${fmtNum((ctx.front?.points || [])[i]?.occupied || 0, 0)} ${unit("км²")}`;
      if (rng) rng.value = i;
    };
    rng?.addEventListener("input", () => setFrame(+rng.value));
    play?.addEventListener("click", () => {
      if (state.timer) { clearInterval(state.timer); state.timer = null; play.textContent = L.mapPlay; return; }
      play.textContent = L.mapPause;
      let i = 0; setFrame(0);
      state.timer = setInterval(() => { i++; if (i >= frames.length) { clearInterval(state.timer); state.timer = null; play.textContent = L.mapPlay; return; } setFrame(i); }, 650);
    });
    app.querySelectorAll("[data-layer]").forEach((bt) => bt.addEventListener("click", () => {
      state.layer = bt.dataset.layer;
      const sec = $("#map", app), tmp = document.createElement("div");
      tmp.innerHTML = renderMap(b, ctx); sec.replaceWith(tmp.firstElementChild);
      wireMap(app, ctx, b);
    }));
  }

  function renderTileMap(b, ctx) {
    const layer = state.layer || "status";
    const cells = REGIONS.map((r) => {
      const st = b.regions?.[r[0]] || "rear", p = regionProc(ctx.proc, r);
      let cls = "", val = "", tip = "";
      if (layer === "status") { cls = `rs-${st}`; tip = L.regStatus[st]; }
      else if (layer === "alerts") {
        const h = ctx.alerts?.regions?.[r[0]];
        cls = h == null ? "nd" : `q${Math.min(4, Math.floor(h / 30))}`; val = h == null ? "" : `${fmtNum(h, 0)} ${LANG === "en" ? "h" : "ч"}`; tip = h == null ? L.noData : fmtNum(h, 1);
      }
      else if (layer === "noncomp") {
        const share = p && p.total ? (p.noncomp / p.total) * 100 : null;
        cls = share == null ? "nd" : `q${Math.min(4, Math.floor(share / 15))}`; val = share == null ? "" : `${fmtNum(share, 0)}%`;
        tip = share == null ? L.noData : `${fmtNum(share, 1)}% · ${p.noncomp}/${p.total}`;
      } else {
        const v = p?.total || 0, max = Math.max(...REGIONS.map((rr) => regionProc(ctx.proc, rr)?.total || 0), 1);
        cls = p ? `q${Math.min(4, Math.floor((Math.sqrt(v / max)) * 5))}` : "nd"; val = p ? fmtNum(v, 0) : ""; tip = p ? fmtNum(v, 0) : L.noData;
      }
      return `<div class="cell ${cls}" style="grid-column:${r[1] + 1};grid-row:${r[2] + 1}" title="${esc(regName(r))}: ${esc(tip)}"><span class="cn">${esc(regName(r))}</span><span class="cv">${esc(val)}</span></div>`;
    }).join("");
    const legend = layer === "status"
      ? ["occupied", "partial", "front", "rear"].map((s) => `<span><i class="rs-${s}"></i>${esc(L.regStatus[s])}</span>`).join("")
      : `<span class="grad"><i class="q0"></i><i class="q1"></i><i class="q2"></i><i class="q3"></i><i class="q4"></i></span><span>${layer === "noncomp" ? "0% → 60%+" : layer === "alerts" ? (LANG === "en" ? "0 → 120 h+" : "0 → 120 ч+") : "↑"}</span><span><i class="nd"></i>${esc(L.noData)}</span>`;
    const procOk = !!ctx.proc;
    return `<section id="map">
      <div class="sec-head"><h2>${esc(L.map)}</h2><span class="label">${esc(L.mapSub)}</span></div>
      <div class="card mapcard">
        <div class="seg map-seg" role="group">${Object.entries(L.layers).map(([k, t]) => `<button type="button" id="layer-${k}" data-layer="${k}" aria-pressed="${k === layer}" ${((k === "noncomp" || k === "volume") && !procOk) || (k === "alerts" && !ctx.alerts) ? "disabled" : ""}>${esc(t)}</button>`).join("")}</div>
        <div class="tilemap">${cells}</div>
        <div class="map-legend">${legend}</div>
        <p class="basis">${esc(L.mapNote)}</p>
      </div>
    </section>`;
  }

  /* ---------- Коррупция ---------- */
  function rangeChart(items) {
    const W = 560, rowH = 46, m = { l: 8, r: 70, t: 8 }, H = m.t + items.length * rowH + 22;
    const max = Math.max(...items.map((x) => x.high)), ticks = niceTicks(0, max, 4), top = ticks[ticks.length - 1];
    const X = (v) => m.l + (v / top) * (W - m.l - m.r);
    const rows = items.map((x, i) => {
      const y = m.t + i * rowH, by = y + 22, x0 = X(x.low), x1 = X(x.high);
      const val = x.low === x.high ? fmtNum(x.low, 0) : `${fmtNum(x.low, 0)}–${fmtNum(x.high, 0)}`;
      return `<g><text class="rl" x="${m.l}" y="${y + 12}">${esc(x.label)}</text>
        <rect x="${m.l}" y="${by}" width="${W - m.l - m.r}" height="10" rx="5" class="track"/>
        <rect x="${m.l}" y="${by}" width="${Math.max(6, x0 - m.l)}" height="10" rx="5" class="bar"/>
        ${x1 > x0 ? `<rect x="${x0 - 5}" y="${by}" width="${x1 - x0 + 5}" height="10" rx="5" class="bar range"/>` : ""}
        <text class="rv" x="${x1 + 8}" y="${by + 9}">${val}</text><title>${esc(x.label)}: ${val} · ${esc(x.source)}</title></g>`;
    }).join("");
    const axis = ticks.map((t) => `<text class="ax" x="${X(t)}" y="${H - 4}" text-anchor="middle">${fmtNum(t, 0)}</text>`).join("");
    return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(L.systemicTitle)}">${rows}${axis}</svg>`;
  }
  function dots(n) {
    const k = n > 120 ? 10 : 1, cnt = Math.max(1, Math.round(n / k));
    return `<div class="dots" title="${esc(L.dotNote(k))}">${Array.from({ length: Math.min(cnt, 150) }, () => "<i></i>").join("")}</div><span class="dot-note">${esc(L.dotNote(k))}</span>`;
  }
  function renderProcurement(proc) {
    if (!proc) return "";
    const rows = Object.entries(proc.topics).map(([k, t]) => `<tr><td>${esc(L.topics[k] || k)}</td><td class="num">${fmtNum(t.count, 0)}</td><td class="num">${fmtBig(t.value)}</td>
      <td class="num">${t.value ? `${t.truncated ? "≈" : ""}${fmtNum(Math.min(100, (t.noncomp_value / Math.max(t.value, t.noncomp_value)) * 100), 0)}% · ${fmtBig(t.noncomp_value)}` : "—"}</td></tr>`).join("");
    const SENS = new Set(["energy_protection", "fortification"]);
    const top = Object.entries(proc.topics).filter(([k]) => !SENS.has(k)).flatMap(([k, t]) => t.top.map((x) => ({ ...x, topic: k }))).sort((a, c) => c.value - a.value).slice(0, 8);
    return `<div class="card proc">
      <div class="sec-head"><h3>${esc(L.procTitle)}<span class="tag">${L.auto}</span></h3><span class="label">${esc(L.procSub)} · ${fmtDate(proc.updated)}</span></div>
      <div class="proc-k"><div><span class="pc-n">${fmtNum(Object.values(proc.topics).reduce((a, t) => a + t.count, 0), 0)}</span><span class="muted">${esc(L.procTotal)}</span></div>
        <div><span class="pc-n">${proc.risk_noncomp_value_share == null ? "—" : fmtNum(proc.risk_noncomp_value_share, 1) + "%"}</span><span class="muted">${esc(L.procNon)}</span></div></div>
      <div class="tablebox"><table><thead><tr>${L.procCols.map((c) => `<th>${c}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>
      ${top.length ? `<h4>${esc(L.procTop)}</h4><ul class="proc-top">${top.map((x) => `<li><a href="https://prozorro.gov.ua/tender/${esc(x.id)}" target="_blank" rel="noopener">${esc(x.title)}</a>
        <span class="muted">${esc(x.buyer)} · ${esc(L.topics[x.topic])}</span><b class="num">${fmtBig(x.value)} ${esc(unit("грн"))}</b></li>`).join("")}</ul>` : ""}
      <p class="basis">${esc(L.procNote)}</p>
    </div>`;
  }
  function renderCorruption(b, ctx) {
    const C = b.corruption; if (!C) return "";
    const nameOf = (id) => (b.domains.find((d) => d.id === id) || {}).name || id;
    const usd = pointAt(ctx.ind.series.usd?.points || [], b.compiled)?.[1] || 45;
    const K = C.constants, interUah = K.interceptorUsd * usd;
    const calc = C.cases.filter((c) => c.uah > 0).sort((a, c) => c.uah - a.uah).slice(0, 3);
    const spheres = [...C.spheres].sort((a, c) => c.risk - a.risk);
    return `<section id="corruption" class="corr">
      <div class="corr-head"><div><span class="label">${esc(L.nav.corruption)}</span><h2 class="big">${esc(L.corrTitle)}</h2></div><p class="lead">${esc(C.lead)}</p></div>
      <div class="kpis kpis-wide">${C.kpis.map((k) => `<div class="card kpi"><span class="label">${esc(k.label)}</span>
        <span class="v">${esc(k.value)}</span><span class="s ${k.dir === "good" ? "good" : k.dir === "bad" ? "bad" : ""}">${esc(k.sub)}</span>
        <span class="src">${esc(k.source)} ${confBadge(k.conf)}</span></div>`).join("")}</div>
      <div class="sec-head"><h3 class="h3big">${esc(L.priceTitle)}</h3><span class="label">${esc(L.priceSub)} · 1 $ = ${fmtNum(usd, 2)} ₴</span></div>
      <div class="price">${calc.map((c) => { const sh = c.uah / K.shelterUah, it = c.uah / interUah; return `<div class="card pcard">
          <div class="pc-top"><span class="dico">${icon(c.sphere)}</span><div><b>${esc(c.title)}</b><span class="pc-amt">${esc(c.amount)}</span></div></div>
          <div class="pc-eq"><div><span class="pc-n">≈ ${fmtNum(sh, sh < 10 ? 1 : 0)}</span><span class="pc-u">${ICON.shield}${esc(L.shelters)}</span>${dots(sh)}</div>
            <div><span class="pc-n">≈ ${fmtNum(it, 0)}</span><span class="pc-u">${ICON.drone}${esc(L.interceptors)}</span></div></div></div>`; }).join("")}</div>
      <p class="basis">${esc(L.basis)}: ${LANG === "en" ? "UAH " + fmtNum(K.shelterUah / 1e6, 0) + "m" : fmtNum(K.shelterUah / 1e6, 0) + " млн ₴"} — ${esc(K.shelterSrc)}; $${fmtNum(K.interceptorUsd / 1000, 0)}k — ${esc(K.interceptorSrc)}.</p>
      ${renderProcurement(ctx.proc)}
      <div class="corr-two">
        <div class="card chartcard"><div class="sec-head"><h3>${esc(L.systemicTitle)}</h3><span class="label">${esc(L.systemicSub)}</span></div>
          <div class="range">${rangeChart(C.systemic)}</div>
          <ul class="mini-src">${C.systemic.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.source)}</a></li>`).join("")}</ul></div>
        <div class="card chartcard"><div class="sec-head"><h3>${esc(L.riskTitle)}</h3><span class="label">${esc(L.riskSub)}</span></div>
          <div class="risklist">${spheres.map((s) => `<a class="riskrow" href="#corr-${s.id}"><span class="dico sm">${icon(s.id)}</span><span>${esc(nameOf(s.id))}</span><span class="risk r${s.risk}">${riskBar(s.risk)}</span></a>`).join("")}</div></div>
      </div>
      <div class="sec-head"><h3 class="h3big">${esc(L.withoutTitle)}</h3></div>
      <div class="without">${spheres.map((s) => `<article class="card wcard" id="corr-${s.id}">
        <div class="w-top"><span class="dico">${icon(s.id)}</span><b>${esc(nameOf(s.id))}</b><span class="risk r${s.risk}" title="${esc(L.corrRisk)} ${s.risk}/5">${riskBar(s.risk)}</span></div>
        <div class="chips">${s.schemes.map((x) => `<span>${esc(x)}</span>`).join("")}</div><p>${esc(s.without)}</p></article>`).join("")}</div>
      <div class="sec-head"><h3 class="h3big">${esc(L.casesTitle)}</h3></div>
      <div class="card tablebox"><table><thead><tr>${L.casesCols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${C.cases.map((c) => `<tr><td><a href="${esc(c.url)}" target="_blank" rel="noopener"><b>${esc(c.title)}</b></a><div class="muted">${esc(c.detail)}</div></td>
          <td><span class="sph">${icon(c.sphere)}${esc(nameOf(c.sphere))}</span></td><td class="num">${esc(c.amount)}</td><td>${esc(c.stage)}</td></tr>`).join("")}</tbody></table></div>
      <div class="sec-head"><h3 class="h3big">${esc(L.corrRecs)}</h3></div>
      ${disclaimer()}
      <div class="recs">${C.recs.map(renderRec).join("")}</div>
      <p class="basis">${esc(C.note)}</p>
    </section>`;
  }

  const renderPriorities = (b) => `<section id="priorities"><div class="sec-head"><h2>${esc(L.priorities)}</h2></div>${disclaimer()}
    <ol class="prio">${b.priorities.map((p) => `<li class="card"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></li>`).join("")}</ol></section>`;

  function renderJournal(b, all) {
    const map = new Map();
    all.filter((x) => x.id <= b.id).forEach((x) => (x.journal || []).forEach((j) => map.set(j.rec, j)));
    const rows = [...map.values()].sort((a, c) => a.due.localeCompare(c.due));
    const t = rows.reduce((a, j) => ((a[j.status] = (a[j.status] || 0) + 1), a), {});
    const checked = (t.done || 0) + (t.failed || 0) + (t.partial || 0);
    const acc = checked ? ((t.done || 0) + 0.5 * (t.partial || 0)) / checked * 100 : null;
    const res = rows.filter((j) => j.prob != null && j.status !== "pending");
    const brier = res.length ? res.reduce((s, j) => s + (j.prob - (j.status === "done" ? 1 : j.status === "partial" ? 0.5 : 0)) ** 2, 0) / res.length : null;
    const withP = rows.filter((j) => j.prob != null);
    const avgP = withP.length ? Math.round((withP.reduce((s, j) => s + j.prob, 0) / withP.length) * 100) : null;
    return `<section id="journal">
      <div class="sec-head"><h2>${esc(L.journal)}</h2><span class="label">${Object.entries(t).map(([k, v]) => `${L.jstatus[k]}: ${v}`).join(" · ")}</span></div>
      <div class="acc card"><div><span class="label">${esc(L.accuracy)}</span><span class="acc-n">${acc == null ? "—" : `${fmtNum(acc, 0)}%`}</span></div>
        <div class="acc-bar">${["done", "partial", "failed", "pending"].map((s) => t[s] ? `<i class="st-${s}" style="flex:${t[s]}" title="${L.jstatus[s]}: ${t[s]}"></i>` : "").join("")}</div>
        <span class="muted">${acc == null ? esc(L.accNone) : esc(L.accOf(checked, rows.length))}</span></div>
      <div class="acc card"><div><span class="label">${esc(L.brier)}</span><span class="acc-n">${brier == null ? "—" : fmtNum(brier, 2)}</span></div>
        <div class="acc-bar brier"><i style="flex:${brier == null ? 0 : Math.max(0.02, 1 - brier / 0.25)};--c:var(--ok)"></i><i style="flex:${brier == null ? 1 : Math.min(1, brier / 0.25)};--c:var(--surface-3)"></i></div>
        <span class="muted">${brier == null ? (avgP == null ? "—" : esc(L.avgConf(withP.length, avgP))) : esc(L.brierNote(res.length))}</span></div>
      <div class="card tablebox"><table><thead><tr>${L.jcols.map((c) => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>${rows.map((j) => { const od = j.status === "pending" && j.due < b.compiled; return `<tr><td>${esc(j.rec)}</td><td>${esc(j.check)}</td>
          <td>${j.prob == null ? "—" : `<span class="pbar"><i style="width:${j.prob * 100}%"></i></span><span class="mono">${Math.round(j.prob * 100)}%</span>`}</td>
          <td class="num ${od ? "overdue" : ""}">${fmtDate(j.due)}${od ? ` · ${L.overdue}` : ""}</td>
          <td><span class="pill st-${j.status}">${L.jstatus[j.status] || j.status}</span></td><td>${esc(j.result || "")}</td></tr>`; }).join("")}</tbody></table></div>
    </section>`;
  }

  const renderMethod = (b) => `<section id="method">
      <div class="sec-head"><h2>${esc(L.method)}</h2></div>
      <div class="method-grid">
        <div class="card mcard"><h3>${esc(L.methodIndex)}</h3><p>${esc(L.methodIndexText)}</p>
          ${state.hist?.validation ? `<h3>${esc(L.validation)}</h3><p>${esc(state.hist.validation[LANG] || state.hist.validation.ru)}</p>` : ""}
          ${state.hist?.lightsNote ? `<h3>${esc(L.lights)}</h3><p>${esc(L.lightsNote)} ${esc(state.hist.lightsNote[LANG] || state.hist.lightsNote.ru)}</p>` : ""}
          <h3>${esc(L.confLegend)}</h3><div class="cf-legend">${Object.keys(L.conf).map((c) => confBadge(c)).join("")}</div></div>
        <div class="card mcard"><h3>${esc(L.rules)}</h3><ul>${L.rulesList.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
          <h3>${esc(L.corrections)}</h3>${(b.corrections || []).length ? `<ul>${b.corrections.map((c) => `<li><span class="mono">${esc(c.date)}</span> ${esc(c.text)}</li>`).join("")}</ul>` : `<p class="muted">${esc(L.noCorrections)}</p>`}</div>
      </div>
      <div class="two">
        <div class="card gaps"><h3>${esc(L.gaps)}</h3><ul>${b.gaps.map((g) => `<li>${esc(g)}</li>`).join("")}</ul></div>
        <div class="card sources" id="sources"><h3>${esc(L.sources)}</h3>
          <ul>${b.sources.map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></li>`).join("")}
          <li><a href="https://bank.gov.ua/ua/open-data/api-dev" target="_blank" rel="noopener">${esc(L.nbuApi)}</a></li>
          <li><a href="https://deepstatemap.live" target="_blank" rel="noopener">DeepState</a></li>
          <li><a href="https://prozorro.gov.ua" target="_blank" rel="noopener">Prozorro</a></li></ul></div>
      </div>
    </section>`;

  function renderAbout(b) {
    const C = state.config || {};
    const issueUrl = C.repoUrl ? `${C.repoUrl.replace(/\/$/, "")}/issues/new?template=correction.yml` : "";
    const base = (C.siteUrl || "").replace(/\/$/, "");
    const embed = `<iframe src="${base || "."}/embed.html?lang=${LANG}" width="360" height="210" style="border:0;border-radius:16px" title="${LANG === "en" ? "Ukraine Barometer" : L.brand}" loading="lazy"></iframe>`;
    return `<section id="about">
      <div class="sec-head"><h2>${esc(L.about)}</h2></div>
      <div class="about-grid">
        <div class="card mcard about-main"><p class="about-lead">${esc(L.aboutLead)}</p>
          <h3>${esc(L.aboutWho)}</h3><p>${esc(L.aboutWhoText)}</p>
          <h3>${esc(L.aboutLimits)}</h3><p>${esc(L.aboutLimitsText)}</p>
          <h3>${esc(L.aboutFix)}</h3><p>${esc(L.aboutFixText)}</p>
          ${issueUrl ? `<a class="btn" style="justify-self:start;text-decoration:none" href="${esc(issueUrl)}" target="_blank" rel="noopener">${esc(L.reportBtn)}</a>` : ""}</div>
        <div class="side">
          <div class="card mcard"><h3>${esc(L.dataTitle)}</h3><p>${esc(L.dataText)}</p>
            <ul class="dl"><li><a href="data/export/barometer.csv">${esc(L.dlCsv)}</a></li><li><a href="data/briefs/${b.id}/${LANG}.json">${esc(L.dlJson)}</a></li>
            <li><a href="feed${LANG === "ru" ? "" : "-" + LANG}.xml">${esc(L.rss)}</a></li>
            ${C.telegramUrl ? `<li><a href="${esc(C.telegramUrl)}" target="_blank" rel="noopener">${esc(L.subscribe)}</a></li>` : ""}
            <li><a href="issues/${b.id}/${LANG === "ru" ? "" : LANG + ".html"}">${esc(L.shareIssue)}</a></li>
            <li><a href="issues/${b.id}/barometer-${b.id}-${LANG}.pdf" download>PDF · ${L.briefNo} ${b.number}</a></li></ul></div>
          <div class="card mcard"><h3>${esc(L.embedTitle)}</h3><p>${esc(L.embedText)}</p>
            <textarea class="embed-code" id="embed-code" readonly rows="4">${esc(embed)}</textarea>
            <button type="button" class="btn ghost" id="embed-copy" style="justify-self:start">${esc(L.copy)}</button></div>
        </div>
      </div>
    </section>`;
  }

  /* ======================= Поиск по выпускам ======================= */
  function searchAll(q) {
    q = q.trim().toLowerCase(); if (q.length < 3) return [];
    const out = [];
    const hit = (s) => s && String(s).toLowerCase().includes(q);
    const snip = (s) => { s = String(s); const i = s.toLowerCase().indexOf(q); return (i > 40 ? "…" : "") + s.slice(Math.max(0, i - 40), i + q.length + 60) + "…"; };
    (state.all || []).forEach((b) => {
      b.headline.forEach((h) => { if (hit(h.title) || hit(h.text)) out.push({ b, anchor: "overview", title: h.title, text: snip(hit(h.title) ? h.title : h.text) }); });
      b.domains.forEach((d) => {
        const all = [...d.situation, d.diagnosis, ...d.recs.map((r) => r.title + " " + (r.effect || ""))];
        const f = all.find(hit); if (f || hit(d.name)) out.push({ b, anchor: `dom-${d.id}`, open: d.id, title: d.name, text: snip(f || d.name) });
      });
      (b.corruption?.cases || []).forEach((c) => { if (hit(c.title) || hit(c.detail)) out.push({ b, anchor: "corruption", title: c.title, text: snip(hit(c.title) ? c.title : c.detail) }); });
    });
    return out.slice(0, 14);
  }
  function wireSearch() {
    const inp = $("#search"), box = $("#search-res"); if (!inp) return;
    inp.placeholder = L.searchPh; inp.setAttribute("aria-label", L.search);
    const show = () => {
      const r = searchAll(inp.value);
      box.hidden = inp.value.trim().length < 3;
      box.innerHTML = r.length ? r.map((x, i) => `<button type="button" class="sr" data-i="${i}"><span class="label">${L.briefNo} ${x.b.number} · ${esc(x.b.period)}</span><b>${esc(x.title)}</b><span>${esc(x.text)}</span></button>`).join("") : `<p class="muted">${esc(L.noResults)}</p>`;
      box.querySelectorAll(".sr").forEach((el) => el.addEventListener("click", async () => {
        const x = r[+el.dataset.i]; box.hidden = true; inp.value = "";
        if (state.week !== x.b.id) { state.week = x.b.id; store.set("shtab-week", x.b.id); await render(); }
        const tgt = document.getElementById(x.anchor);
        if (x.open) { const det = tgt?.querySelector("details"); if (det) { tgt.hidden = false; det.open = true; } }
        tgt?.scrollIntoView({ behavior: "smooth", block: "start" });
      }));
    };
    inp.oninput = show;
    if (!wireSearch.hot) {
      wireSearch.hot = true;
      document.addEventListener("keydown", (e) => {
        if (e.key === "/" && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "")) { e.preventDefault(); $("#search")?.focus(); }
      });
      document.addEventListener("click", (e) => { if (!e.target.closest(".search-wrap")) $("#search-res").hidden = true; });
    }
    inp.onkeydown = (e) => { if (e.key === "Escape") { inp.value = ""; box.hidden = true; } };
  }

  /* ======================= Навигация и связывание ======================= */
  function renderChrome() {
    document.documentElement.lang = LANG;
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = L[el.dataset.i18n]; });
    const NAV_ICON = { story: "drone", decisions: "shield", overview: "spark", markets: "economy", domains: "front", whatif: "up", russia: "airdef", map: "diplomacy", corruption: "anticorr", journal: "info", method: "finance", about: "society" };
    $("#nav").innerHTML = Object.entries(L.nav).map(([id, t]) => `<a href="#${id}" data-sec="${id}">${icon(NAV_ICON[id])}<span>${esc(t)}</span></a>`).join("");
    document.querySelectorAll("#lang button").forEach((bt) => bt.setAttribute("aria-pressed", String(bt.dataset.lang === LANG)));
    $("#foot-note").textContent = L.foot;
  }

  let observer = null;
  function wire(app, ctx, b) {
    app.querySelectorAll(".chart-box").forEach((box) => {
      const s = ctx._series[box.dataset.series];
      const pts = clip(s.points, b.compiled).filter((p) => p[0] >= shiftDate(b.compiled, -+box.dataset.days));
      if (pts.length > 1) lineChart(box, pts, { u: unit(s.unit), decimals: +box.dataset.dec, step: box.dataset.step === "true" });
    });
    const chips = app.querySelectorAll(".chip");
    chips.forEach((c) => c.addEventListener("click", () => {
      chips.forEach((x) => x.setAttribute("aria-pressed", String(x === c)));
      app.querySelectorAll(".dom").forEach((d) => { d.hidden = c.dataset.filter !== "all" && d.dataset.status !== c.dataset.filter; });
    }));
    app.querySelectorAll("[data-open]").forEach((a) => a.addEventListener("click", () => {
      const art = $(`#dom-${a.dataset.open}`, app); if (!art) return;
      art.hidden = false; $("details", art).open = true;
    }));
    // Что если
    const boxes = [...app.querySelectorAll(".wi-item input")];
    boxes.forEach((x) => { x.checked = state.sim.has(x.dataset.key); x.addEventListener("change", () => { x.checked ? state.sim.add(x.dataset.key) : state.sim.delete(x.dataset.key); updateWhatIf(b); }); });
    $("#wi-all")?.addEventListener("click", () => { boxes.forEach((x) => { x.checked = true; state.sim.add(x.dataset.key); }); updateWhatIf(b); });
    $("#wi-none")?.addEventListener("click", () => { boxes.forEach((x) => { x.checked = false; }); state.sim.clear(); updateWhatIf(b); });
    updateWhatIf(b);
    // Виджет: копирование кода
    $("#embed-copy")?.addEventListener("click", async (e) => {
      const ta = $("#embed-code");
      try { await navigator.clipboard.writeText(ta.value); e.target.textContent = L.copied; } catch (err) { ta.select(); }
    });
    // Карта
    if (state.timer) { clearInterval(state.timer); state.timer = null; }
    wireMap(app, ctx, b);
    wireStory(app, b, ctx);
    if (observer) observer.disconnect();
    if ("IntersectionObserver" in window) {
      const links = [...document.querySelectorAll("#nav a")];
      observer = new IntersectionObserver((entries) => {
        entries.forEach((e) => { if (e.isIntersecting) links.forEach((l) => l.classList.toggle("active", l.dataset.sec === e.target.id)); });
      }, { rootMargin: "-40% 0px -55% 0px" });
      Object.keys(L.nav).forEach((id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    }
  }
  wire.mapOnly = (app, ctx, b) => app.querySelectorAll("[data-layer]").forEach((bt) => bt.addEventListener("click", () => {
    state.layer = bt.dataset.layer;
    const sec = $("#map", app), tmp = document.createElement("div");
    tmp.innerHTML = renderMap(b, ctx); sec.replaceWith(tmp.firstElementChild);
    wire.mapOnly(app, ctx, b);
  }));

  /* ======================= Состояние ======================= */
  const state = { list: [], ctx: null, week: null, sim: new Set(), layer: "status", hist: null, config: null, all: [], cmp: null };

  async function render() {
    L = I18N[LANG];
    renderChrome();
    const sel = $("#week-select");
    sel.innerHTML = [...state.list].reverse().map((x) => `<option value="${x.id}">${L.briefNo} ${x.number} · ${esc(x.period[LANG] || x.period.ru)}</option>`).join("");
    sel.value = state.week;
    const raw = await Promise.all(state.list.map((x) => getJSON(`data/briefs/${x.id}/${LANG}.json`).catch(() => getJSON(`data/briefs/${x.id}/ru.json`))));
    const all = raw.map((x) => prepare(x, state.ctx));
    const b = all.find((x) => x.id === state.week), prev = all.filter((x) => x.id < b.id).pop() || null;
    state.all = all;
    const app = $("#app");
    app.innerHTML = renderScreen(b, prev) + renderOverview(b, prev, all, state.hist) + renderStory(b, state.ctx) + renderTiles(b, all) + renderMarkets(b, state.ctx) + renderDomains(b)
      + renderPriorities(b) + renderWhatIf(b) + renderRussia(b) + renderMap(b, state.ctx) + renderCorruption(b, state.ctx) + renderJournal(b, all) + renderDecisions(b, all) + renderMethod(b) + renderAbout(b);
    wire(app, state.ctx, b);
    wireSearch();
    $("#cmp-select")?.addEventListener("change", (e) => { state.cmp = e.target.value; render(); });
    $("#updated").textContent = `${L.updated} ${fmtDate(state.ctx.ind.updated)}`;
    document.title = `${LANG === "en" ? "Ukraine Barometer" : L.brand} · ${L.briefNo} ${b.number}`;
  }

  async function main() {
    const qs = new URLSearchParams(location.search);
    const saved = qs.get("lang") || store.get("shtab-lang"), nav = (navigator.language || "").slice(0, 2);
    LANG = LANGS.includes(saved) ? saved : nav === "uk" ? "uk" : "ru";
    L = I18N[LANG];
    renderChrome();
    try {
      const man = await getJSON("data/manifest.json", true);
      const has = (f) => !man || man.files.includes(f);
      const opt = (f) => has(f) ? getJSON(`data/${f}`, true) : Promise.resolve(null);
      const [idx, ind, front, proc, hist, config, alerts] = await Promise.all([getJSON("data/briefs/index.json"), getJSON("data/indicators.json"),
        opt("front.json"), opt("procurement.json"), opt("history.json"), getJSON("config.json", true), opt("alerts.json")]);
      const [oblasts, frontline, lights, media] = await Promise.all(["oblasts", "frontline", "lights", "media"].map((n) => opt(`${n}.json`)));
      state.hist = hist; state.config = config;
      state.list = [...idx.briefs].sort((a, c) => a.id.localeCompare(c.id));
      state.ctx = { ind, front, proc, alerts, oblasts, frontline, lights, media };
      const sw = qs.get("week") || store.get("shtab-week");
      if (config?.goatcounter && !document.getElementById("gc")) {
        const s = document.createElement("script"); s.id = "gc"; s.async = true; s.src = "https://gc.zgo.at/count.js";
        s.dataset.goatcounter = `https://${config.goatcounter}.goatcounter.com/count`; document.head.appendChild(s);
      }
      state.week = state.list.some((x) => x.id === sw) ? sw : state.list[state.list.length - 1].id;
      $("#week-select").addEventListener("change", (e) => { state.week = e.target.value; store.set("shtab-week", state.week); render(); });
      document.querySelectorAll("#lang button").forEach((bt) => bt.addEventListener("click", () => { LANG = bt.dataset.lang; store.set("shtab-lang", LANG); render(); }));
      await render();
    } catch (e) {
      $("#app").innerHTML = `<div class="error"><b>${esc(L.loadErr)}</b><br>${esc(e.message)}<br>${esc(L.serverHint)}
        <span class="mono">python -m http.server 8000</span> → <span class="mono">http://localhost:8000</span></div>`;
      console.error(e);
    }
  }

  main();
})();
