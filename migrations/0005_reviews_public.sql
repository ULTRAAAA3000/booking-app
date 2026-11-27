-- Відгуки: ім'я автора (для гостей без акаунта) і ознака підтвердженого бронювання.
ALTER TABLE reviews ADD COLUMN author_name TEXT;
ALTER TABLE reviews ADD COLUMN verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0,1));
UPDATE reviews SET verified=1 WHERE booking_id IS NOT NULL;
-- Рейтинги з початкового демо-сіду (4,8 / 128) були заглушкою: далі рейтинг рахується лише з реальних відгуків.
UPDATE properties SET
  rating_avg   = COALESCE((SELECT ROUND(AVG(r.rating),2) FROM reviews r WHERE r.property_id=properties.id AND r.is_published=1),0),
  rating_count = (SELECT COUNT(*) FROM reviews r WHERE r.property_id=properties.id AND r.is_published=1);
