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
  stays.html       каталог з фільтрами (регіон, тип, гості, ціна, дати, сортування), адреса фільтрів у URL
  account.html     особистий кабінет: бронювання (скасування, відгуки), обране, профіль, безпека, налаштування
  book.html        форма бронювання (дані гостя, дати, підсумок, «замовлення прийнято»)
  assets/css|js|img
  assets/js/auth.js  мінімальний акаунт: вхід, реєстрація, вхід за посиланням, соцвходи (демо-заглушка)
wrangler.toml      конфіг Cloudflare Pages (+ закоментований біндинг D1)
functions/         Cloudflare Pages Functions (TypeScript): /api/auth/*, /api/availability, /api/bookings
workers/ical-sync/ Worker із cron для імпорту календарів booking.com
docs/              інструкції (синхронізація з booking.com)
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

## API (functions/api)
| Метод | Шлях | Що робить |
|---|---|---|
| GET | `/api/auth/me` | поточний користувач або `null` |
| POST | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout` | e-mail + пароль, сесія в HttpOnly-cookie |
| GET | `/api/properties?region&type&guests&min&max&in&out&q&sort&limit&offset` | каталог осель з фільтрами та вільними датами |
| GET | `/api/properties/:slug` | повна картка оселі: опис, фото, зручності, рейтинг |
| GET | `/api/ical/:slug.ics?t=токен` | наш календар для booking.com (без персональних даних) |
| GET | `/api/availability?slug&in&out&guests` | дані оселі, чи вільні дати, сума |
| GET | `/api/availability?slug&busy=1` | зайняті періоди для календаря на сторінці оселі |
| POST | `/api/bookings` | створити бронювання (з акаунтом або без) |
| GET | `/api/bookings` | мої бронювання (потрібен вхід) |

| POST | `/api/bookings/cancel` | скасувати майбутнє бронювання |
| GET, POST | `/api/favorites` | обране (серденька синхронізуються з акаунтом) |
| GET, POST | `/api/reviews` | мої відгуки; відгук після виїзду, один на бронювання |
| GET, PATCH, DELETE | `/api/account` | профіль, налаштування сповіщень, видалення акаунта (дані знеособлюються) |
| POST | `/api/account/password` | зміна пароля (інші пристрої розлогінюються) |
| GET, DELETE | `/api/account/sessions` | активні входи / вийти на інших пристроях |

Сервер сам рахує суму й перевіряє дати, гостей та доступність; подвійну бронь додатково блокує тригер у базі. Листи поки не надсилаються, оплати немає.

## Налаштування Cloudflare
1. `npm run db:create` → `database_id` у `wrangler.toml` (розкоментувати блок D1) → `npm run db:migrate:remote`.
2. Pages → Connect to Git → репозиторій; Framework: None, Build command: порожньо, Output directory: `public`.
3. Секрет `SESSION_SECRET` (довгий випадковий рядок): `npx wrangler pages secret put SESSION_SECRET --project-name booking-app` або Dashboard → Settings → Variables and Secrets (Secret, Production і Preview).
4. Якщо D1 не прописаний у `wrangler.toml`, додайте біндинг у Dashboard: Settings → Bindings → D1 database, змінна `DB`.

Локально: `cp .dev.vars.example .dev.vars`, `npm install`, `npm run db:migrate:local`, `npm run dev`.

## Сторінка оселі
Відкривається з головної або каталогу за адресою `index.html#stay=slug`. Дати вибираються в календарі на картці бронювання (зайняті дні вимкнені), обрані дати передаються у форму `book.html`.

## Синхронізація з booking.com
Інструкція: [`docs/booking-com-sync.md`](docs/booking-com-sync.md). Кроки: зв'язок у `channel_links` → наше `.ics`-посилання у Booking → `npm run deploy:sync`.
