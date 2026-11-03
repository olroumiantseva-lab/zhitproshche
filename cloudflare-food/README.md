# Бесплатный backend «ЖИТЬ ПРОЩЕ»: Cloudflare Workers

Цель: заменить остановленный Supabase `food-suggest` без перевода действующих проектов на платный тариф.

## Что подготовлено
- `src/worker.js` — совместимый с текущей страницей POST API: `ingredients`, `excluded`, `people`, `max_time`, `anonymous_id`; возвращает `suggestions`.
- `wrangler.toml` — конфигурация Cloudflare Workers.
- Защита ключа OpenAI через секрет Worker, базовая проверка Origin, ежедневный лимит 5 запросов на сочетание браузерного анонимного ID и IP через KV. **KV — не атомарный rate limiter; при одновременных запросах лимит может быть обойдён.** Для платной нагрузки понадобится более жёсткая серверная защита.
- Ошибки в формате JSON, в том числе `daily_limit` (HTTP 429).

## Запуск без платного Supabase

1. Зарегистрировать бесплатный аккаунт на https://dash.cloudflare.com/ и открыть **Workers & Pages**.
2. Локально из папки `cloudflare-food` выполнить `npx wrangler login`.
3. Создать KV namespace командой `npx wrangler kv namespace create RATE_LIMIT` (синтаксис сверить с используемой версией Wrangler), полученный ID добавить в `wrangler.toml`:
   ```toml
   [[kv_namespaces]]
   binding = "RATE_LIMIT"
   id = "<ID_ИЗ_CLOUDFLARE>"
   ```
4. Выполнить `npx wrangler secret put OPENAI_API_KEY`, вводить ключ только в защищённый секрет.
5. Выполнить `npx wrangler deploy` и получить URL вида `https://zhitproshche-food.<account>.workers.dev`.
6. Проверить POST запрос на 2 порции с `Content-Type: text/plain` и `anonymous_id` вида `zp_<uuid>`, а также ответ OPTIONS и ошибку для неверного Origin.
7. **Только после успешного теста:** заменить URL `apiUrl` в `/assets/config.js` на адрес нового Worker и поднять cache-buster в `/prigotovit/index.html`. Убедиться, что все SEO-страницы вызывают ту же конфигурацию.
8. После переключения проверить реальное создание трёх рецептов, ограничение попыток и Метрику.

Важное: Cloudflare Free не взимает плату за подходящую под квоты работу Worker/KV, но **OpenAI API тарифицируется отдельно**. Ключ и исходные продукты не надо публиковать в GitHub; не передавайте ключ в чат.

Не переключайте фронтенд до рабочего URL — сейчас `zhitproshche.ru` использует остановленный Supabase.
