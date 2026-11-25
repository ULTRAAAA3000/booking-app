-- Налаштування сповіщень користувача (листи поки не надсилаються; значення зберігаємо наперед).
ALTER TABLE users ADD COLUMN notify_email INTEGER NOT NULL DEFAULT 1 CHECK (notify_email IN (0,1));
ALTER TABLE users ADD COLUMN marketing_opt_in INTEGER NOT NULL DEFAULT 0 CHECK (marketing_opt_in IN (0,1));
