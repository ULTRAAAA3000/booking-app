-- Обмеження частоти запитів (антибот): лічильники за вікнами часу. Ключ містить HMAC від IP/e-mail, самих даних тут немає.
CREATE TABLE rate_limits (
  key          TEXT    NOT NULL,
  window_start INTEGER NOT NULL,   -- початок вікна, Unix-секунди
  count        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);
