# Полонина — платформа бронювання осель у Карпатах

Демо головної сторінки (клієнтська частина). Дизайн-основа всього сервісу.

## Стек (план)
- Cloudflare Pages (статичний фронтенд + Functions на TypeScript)
- D1 (SQLite) для даних, R2 для фото
- Лендинг: HTML + CSS + JS; функціональна частина: TypeScript
- Із можливістю перенесення на власний Linux-сервер

## Структура
```
public/            фронтенд (деплоїться як Pages)
  index.html       головна: хіро, пошук, «Рекомендовані оселі», сторінка оселі
  assets/css|js|img
  assets/js/auth.js  мінімальний акаунт: вхід, реєстрація, вхід за посиланням, соцвходи (демо-заглушка)
wrangler.toml      конфіг Cloudflare Pages (+ закоментований біндинг D1)
migrations/        схема бази D1
  0001_init.sql          користувачі, сесії, оселі, фото, броні, доступність, відгуки, обране, аудит
  0002_seed_demo.sql     8 демо-осель із лендингу
```
Локальний запуск: `npx wrangler pages dev public` або будь-який статичний сервер на `public/`.

## Фото
Блок `PHOTOS` на початку `assets/js/main.js`. Фото хіро та мініатюр лежать у `assets/img`.
Фото карток і інтер'єрів зараз — заглушки (зовнішні посилання або згенеровані пейзажі).

## Дорожня карта
1. Каталог `/stays` з фільтрами, сторінка оселі як окремий URL
2. Регіони, гіди, службові сторінки, добір головної
3. Схема D1, API (`functions/api`), фото в R2
4. Бронювання без оплати (оплата — наступний етап)
5. Синхронізація з booking.com (iCal, пізніше API)
6. Адмін-панель на окремій захищеній адресі

## База даних (D1)
Таблиці: `users`, `auth_identities` (Google/Apple/Facebook/Telegram), `sessions`, `magic_links`, `regions`, `properties`,
`property_photos` (R2-ключ або зовнішній url), `amenities`, `property_amenities`, `bookings`, `availability_blocks`,
`channel_links` (booking.com через iCal), `reviews`, `favorites`, `audit_log`.

- Гроші — у копійках (`price_minor`), дати — `YYYY-MM-DD`, `check_out` / `end_date` виключно.
- Подвійні бронювання блокує тригер `trg_bookings_no_overlap` (броні + закриті дати, зокрема з booking.com).
- Паролі лише як хеш, сесії лише як SHA-256 токена; токен живе у cookie.

Запуск:
```
npm install
npm run db:create            # скопіюйте database_id у wrangler.toml і розкоментуйте блок D1
npm run db:migrate:local     # локальна база з демо-даними
npm run db:migrate:remote    # база на Cloudflare
```
