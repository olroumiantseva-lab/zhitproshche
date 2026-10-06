# SEO: подготовка к переобходу

Проверка проведена 06.10.2026. В репозитории найдено 18 публичных HTML-страниц; технические HTML-файлы из `node_modules` и Playwright-отчёта исключены из списка. Все 18 публичных URL уже присутствуют в `sitemap.xml`; отсутствующих публичных URL нет. Каждая страница менялась в Git за последние 14 дней (26.09–06.10.2026), поэтому включена в приоритетный список.

Состояние опубликованного сайта проверено в браузере: все URL отдают HTTP 200, имеют самоканоникал с завершающим `/`, непустые `title` и `description`, один `H1` и не содержат `noindex`. Явный `meta robots` не задан, поэтому действует разрешённое по умолчанию индексирование. Для каждого URL найдена минимум одна внутренняя HTML-ссылка.

| URL | Новая/изменённая | HTTP | Canonical | Индексация разрешена | Sitemap | Действие |
|---|---|---:|---|---|---|---|
| https://zhitproshche.ru/ | изменена | 200 | self | Да | Да | Приоритетный переобход |
| https://zhitproshche.ru/prigotovit/ | существенно изменена | 200 | self | Да | Да, `lastmod` → 2026-10-06 | Приоритетный переобход |
| https://zhitproshche.ru/otvetit/ | изменена | 200 | self | Да | Да | Переобход |
| https://zhitproshche.ru/podarit/ | изменена | 200 | self | Да | Да | Переобход |
| https://zhitproshche.ru/vybrat/ | изменена | 200 | self | Да | Да | Переобход |
| https://zhitproshche.ru/podpiska/ | новая | 200 | self | Да | Да | Приоритетный переобход |
| https://zhitproshche.ru/spisok-pokupok/ | новая | 200 | self | Да | Да | Приоритетный переобход |
| https://zhitproshche.ru/chto-prigotovit-na-uzhin/ | новая, существенно изменена | 200 | self | Да | Да, `lastmod` → 2026-10-06 | Приоритетный переобход |
| https://zhitproshche.ru/chto-prigotovit-bystro/ | новая, существенно изменена | 200 | self | Да | Да, `lastmod` → 2026-10-06 | Приоритетный переобход |
| https://zhitproshche.ru/chto-prigotovit-iz-kuritsy/ | новая, существенно изменена | 200 | self | Да | Да, `lastmod` → 2026-10-06 | Приоритетный переобход |
| https://zhitproshche.ru/chto-prigotovit-iz-farsha/ | новая, существенно изменена | 200 | self | Да | Да, `lastmod` → 2026-10-06 | Приоритетный переобход |
| https://zhitproshche.ru/chto-prigotovit-iz-kartoshki/ | новая | 200 | self | Да | Да | Приоритетный переобход |
| https://zhitproshche.ru/chto-prigotovit-iz-kabachkov/ | новая | 200 | self | Да | Да | Приоритетный переобход |
| https://zhitproshche.ru/chto-prigotovit-iz-tvoroga/ | новая | 200 | self | Да | Да | Приоритетный переобход |
| https://zhitproshche.ru/chto-prigotovit-iz-yaic/ | новая | 200 | self | Да | Да | Приоритетный переобход |
| https://zhitproshche.ru/chto-prigotovit-iz-makaron/ | новая | 200 | self | Да | Да | Приоритетный переобход |
| https://zhitproshche.ru/chto-prigotovit-iz-risa/ | новая | 200 | self | Да | Да | Приоритетный переобход |
| https://zhitproshche.ru/chto-prigotovit-iz-grechki/ | новая | 200 | self | Да | Да | Приоритетный переобход |

## Sitemap и robots

- `https://zhitproshche.ru/robots.txt` — HTTP 200, разрешает обход и объявляет sitemap.
- `https://zhitproshche.ru/sitemap.xml` — HTTP 200, корректно доступен и содержит все 18 публичных URL.
- Обновлены фактические `lastmod` для `/prigotovit/` и четырёх существенно доработанных SEO-страниц.
- Технические пути `/node_modules/`, `/e2e/`, `/playwright-report/` и `/test-results/` закрыты от обхода в `robots.txt`; в sitemap их нет.

## Локальные изменения

- `sitemap.xml` — корректировка `lastmod`, состав публичных URL без изменений.
- `robots.txt` — запрет обхода случайно опубликованных технических артефактов.
- `recrawl-urls.txt` — URL в рекомендуемом порядке отправки в Google Search Console и Яндекс Вебмастер.

Изменения не отправлялись в GitHub. После публикации отправьте обновлённый sitemap в Search Console и Яндекс Вебмастер; список из `recrawl-urls.txt` используйте для запросов на переобход.
