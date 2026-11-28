-- Пошта: повідомлення з форми контактів і токени підтвердження e-mail.
CREATE TABLE contact_messages (
  id          TEXT PRIMARY KEY,                               -- UUID
  user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,   -- якщо писав залогінений користувач
  name        TEXT NOT NULL,
  email       TEXT NOT NULL COLLATE NOCASE,
  phone       TEXT,
  topic       TEXT NOT NULL CHECK (topic IN ('booking','stay','host','other')),
  message     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  handled_at  TEXT                                            -- коли опрацьовано (для адмінки пізніше)
);
CREATE INDEX idx_contact_messages_created ON contact_messages(created_at);

CREATE TABLE email_verifications (
  token_hash  TEXT PRIMARY KEY,                               -- HMAC токена; сам токен лише в листі
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL COLLATE NOCASE,                   -- адреса, яку підтверджуємо (токен діє лише для неї)
  expires_at  TEXT NOT NULL,
  used_at     TEXT,
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_email_verifications_user ON email_verifications(user_id, created_at);
