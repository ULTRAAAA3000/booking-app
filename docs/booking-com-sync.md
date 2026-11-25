# Синхронізація з booking.com (iCal)

Двосторонній обмін календарями без партнерського API:
- **Наші броні та закриті дати → Booking.** Ми віддаємо `.ics` за секретним посиланням, Booking його імпортує.
- **Броні Booking → наші закриті дати.** Worker за розкладом (кожні 15 хв) читає `.ics` із Booking і закриває ці дати в `availability_blocks`. Потім на них не можна забронювати прямо на сайті (захищає тригер у базі).

Обмеження: це не миттєво. Booking оновлює імпорт зі своєю затримкою (зазвичай від кількох хвилин до кількох годин), тож у цьому вікні можливе подвійне бронювання. Конфлікти Worker записує в `channel_links.last_status` («конфліктів із нашими бронями: N»). Миттєву синхронізацію дає лише офіційний Connectivity API (потрібен партнерський статус Booking).
Наявність розділу синхронізації календарів залежить від типу акаунта й об'єкта в кабінеті Booking.com, перевірте у своєму extranet.

## Підключення оселі
1. У кабінеті Booking.com (extranet) знайдіть синхронізацію календарів: там буде посилання на **їхній** календар (для імпорту до нас) і поле для **нашого** посилання.
2. Згенеруйте секрет для нашого посилання: `openssl rand -hex 24`.
3. Додайте зв'язок у базу (підставте slug, секрет і посилання Booking):
```sql
INSERT INTO channel_links (property_id, channel, ical_import_url, ical_export_token)
SELECT id, 'booking_com', 'https://…посилання-на-календар-Booking…', 'ВАШ_СЕКРЕТ'
FROM properties WHERE slug = 'shale-hoverla';
```
Виконати: `npx wrangler d1 execute booking-app --remote --command "…"`.
4. Наше посилання для Booking: `https://ВАШ-ДОМЕН/api/ical/shale-hoverla.ics?t=ВАШ_СЕКРЕТ`. Вставте його в Booking.
5. Задеплойте Worker із синхронізацією (див. нижче).

## Worker `workers/ical-sync`
1. У `workers/ical-sync/wrangler.toml` розкоментуйте блок D1 і вставте той самий `database_id`, що в Pages.
2. `npm run deploy:sync`: з'явиться Worker `booking-app-ical-sync` із cron `*/15 * * * *`.
3. (Необов'язково) ручний запуск: `npx wrangler secret put SYNC_SECRET --config workers/ical-sync/wrangler.toml`, далі
   `curl -X POST https://<worker>.workers.dev/run -H "Authorization: Bearer <SYNC_SECRET>"`.

Новий секрет окремої змінної в Pages не потрібен, посилання захищене токеном із бази.

## Безпека
- У `.ics` немає персональних даних, лише «Reserved» і дати.
- Імпорт приймає лише `https`, відповідь до 2 МБ, з тайм-аутом 10 с. Помилка або не-iCal відповідь не стирає наявні блоки.
- Події з нашими ж ідентифікаторами (`…@polonyna`) не імпортуються, щоб не було циклів.
