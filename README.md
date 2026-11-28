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
  assets/js/auth.js  акаунт: вхід, реєстрація, вхід через Google і Telegram (вмикається змінними), вхід за посиланням (поки заглушка)
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
| GET | `/api/config` | публічні налаштування для браузера (ключ Turnstile, чи увімкнено Google, id бота Telegram) |
| GET | `/api/auth/me` | поточний користувач або `null` |
| GET | `/api/auth/google/start?next=` | початок входу через Google (перенаправлення на Google) |
| GET | `/api/auth/google/callback` | повернення з Google: перевірка state і токена, сесія, перенаправлення на `next` |
| POST | `/api/auth/telegram` | вхід через Telegram: перевірка підпису даних токеном бота |
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
| GET | `/api/reviews?slug=&limit&offset` | публічні відгуки оселі (автор, оцінка, текст, позначка «підтверджене бронювання») |
| GET, POST | `/api/reviews` | GET без `slug`: мої відгуки. POST: відгук може залишити будь-хто; з акаунтом ім'я береться з акаунта, без акаунта вказується ім'я (Turnstile, приманка, ліміт 10 на годину) |
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

## Антибот-захист форм
Реєстрація, вхід і бронювання проходять кілька перевірок (порядок від дешевих до дорогих):
1. **Приманка:** приховане поле `website`; якщо його заповнили, запит відхиляється.
2. **Час заповнення:** форма, відправлена швидше ніж за 1 с (або без поля `t`), відхиляється.
3. **Ліміти частоти** (таблиця `rate_limits`, у ключах лише HMAC від IP / e-mail): вхід 10 / 10 хв на IP і 5 / 10 хв на e-mail, реєстрація 5 / год, бронювання 10 / год, зміна пароля й видалення акаунта 5 / 15 хв на користувача. Відповідь `429` з `Retry-After`.
4. **Cloudflare Turnstile** (якщо задано обидва ключі): токен перевіряється на сервері; якщо Cloudflare недоступний, запит відхиляється (`503`).

Налаштування Turnstile: Cloudflare Dashboard → Turnstile → Add widget → Hostnames: ваш домен `*.pages.dev` і власний домен → Mode: Managed. Далі:
- `TURNSTILE_SITE_KEY`: публічний ключ. Додайте в `wrangler.toml` у блок `[vars]` (див. коментар у файлі): якщо проєкт Pages керується `wrangler.toml`, змінні з Dashboard не застосовуються.
- `TURNSTILE_SECRET`: секретний ключ, **Secret**: `npx wrangler pages secret put TURNSTILE_SECRET --project-name booking-app`.
- Обидва ключі потрібні разом; поки не задано хоч один, перевірка Turnstile вимкнена (діють пункти 1–3).
- Нова міграція: `npm run db:migrate:remote` (`0004_rate_limits.sql`).

## Відгуки
Відгук про оселю можна залишити на її сторінці: із акаунтом ім'я підставляється з акаунта (поле імені ховається), без акаунта гість вводить ім'я сам (від 2 символів) і текст від 10 символів. Якщо в користувача є завершене бронювання цієї оселі, відгук отримує позначку «Підтверджене бронювання» і прив'язується до нього. Без підтвердженого бронювання можна залишити один відгук на оселю з акаунта. Рейтинг оселі (`rating_avg`, `rating_count`) перераховується з реальних відгуків; демо-рейтинг із початкового сіду міграція `0005` скидає. Модерації поки немає: прибирати відгуки можна через `is_published = 0` (адмінка пізніше).

## Вхід через Google і Telegram
Нові міграції не потрібні (використовується таблиця `auth_identities`). Достатньо задати змінні: кнопки у формі входу вмикаються самі, а поки змінних немає, показують «скоро». Усі три значення додаються як **Secret** (Dashboard → Settings → Variables and Secrets або `npx wrangler pages secret put ІМ'Я --project-name booking-app`), локально: у `.dev.vars`.

**Google** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, обидві потрібні разом)
1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → OAuth consent screen: налаштуйте екран згоди (назва, e-mail підтримки; дозволи за замовчуванням `openid`, `email`, `profile`).
2. Credentials → Create credentials → OAuth client ID → тип **Web application**.
3. Authorized redirect URIs: `https://ВАШ-ДОМЕН/api/auth/google/callback`. Для кожного домену окремо (`*.pages.dev` і власний), локально `http://localhost:8788/api/auth/google/callback`.
4. Скопіюйте Client ID і Client secret у змінні.

**Telegram** (`TELEGRAM_BOT_TOKEN`)
1. У [@BotFather](https://t.me/BotFather): `/newbot`, токен бота скопіюйте у змінну.
2. `/setdomain` → оберіть бота → вкажіть домен сайту без `https://`. Telegram дозволяє вхід лише з цього домену (на `localhost` не працює: перевіряйте на розгорнутому сайті).

Як це працює:
- Google: код обмінюється на токен на сервері, `state` лежить в HttpOnly-cookie. Якщо підтверджений e-mail Google збігається з існуючим акаунтом, вхід прив'язується до нього; якщо власник раніше не підтверджував e-mail, пароль і сесії такого акаунта скидаються (захист від реєстрації на чужу пошту). Інакше створюється новий акаунт.
- Telegram: підпис даних перевіряється токеном бота, дані дійсні 1 годину. E-mail Telegram не дає, тому акаунт отримує технічну адресу `…@telegram.invalid`: вона не показується ніде, а у формі бронювання e-mail гість вводить сам.
- Акаунт, створений через соцмережу, не має пароля; пароль можна задати в кабінеті → «Безпека».
- Помилки входу через Google повертають на сайт із повідомленням у формі входу.
