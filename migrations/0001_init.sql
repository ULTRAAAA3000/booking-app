-- Полонина: початкова схема (Cloudflare D1 / SQLite).
-- Дати зберігаються як 'YYYY-MM-DD' (check_out / end_date — виключно), час — ISO-8601 UTC, гроші — у мінорних одиницях (копійки).

-- ===== Користувачі та авторизація =====
CREATE TABLE users (
  id               TEXT PRIMARY KEY,                       -- UUID
  email            TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name             TEXT NOT NULL,
  phone            TEXT,
  password_hash    TEXT,                                   -- 'pbkdf2$iter$salt$hash'; NULL для входу лише через соцмережі / посилання
  role             TEXT NOT NULL DEFAULT 'guest' CHECK (role IN ('guest','host','admin')),
  locale           TEXT NOT NULL DEFAULT 'uk',
  email_verified_at TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_login_at    TEXT,
  deleted_at       TEXT
);

CREATE TABLE auth_identities (                              -- Google / Apple / Facebook / Telegram
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         TEXT NOT NULL CHECK (provider IN ('google','apple','facebook','telegram')),
  provider_user_id TEXT NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (provider, provider_user_id)
);

CREATE TABLE sessions (
  token_hash       TEXT PRIMARY KEY,                       -- SHA-256 токена; сам токен у cookie, у базі його немає
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_agent       TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at       TEXT NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE TABLE magic_links (                                  -- вхід / відновлення за посиланням
  token_hash       TEXT PRIMARY KEY,
  email            TEXT NOT NULL COLLATE NOCASE,
  expires_at       TEXT NOT NULL,
  used_at          TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ===== Каталог =====
CREATE TABLE regions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  description      TEXT,
  lat              REAL,
  lng              REAL,
  sort_order       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE properties (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  region_id        INTEGER NOT NULL REFERENCES regions(id),
  type             TEXT NOT NULL,                          -- grazhda | khata | chalet | koliba | cottage | estate | villa ... (перевіряє застосунок)
  short_desc       TEXT,
  description      TEXT,
  price_minor      INTEGER NOT NULL CHECK (price_minor >= 0),  -- ціна за ніч, копійки
  currency         TEXT NOT NULL DEFAULT 'UAH',
  max_guests       INTEGER NOT NULL DEFAULT 2 CHECK (max_guests > 0),
  bedrooms         INTEGER,
  beds             INTEGER,
  bathrooms        INTEGER,
  area_m2          INTEGER,
  address          TEXT,
  lat              REAL,
  lng              REAL,
  check_in_time    TEXT NOT NULL DEFAULT '14:00',
  check_out_time   TEXT NOT NULL DEFAULT '11:00',
  min_nights       INTEGER NOT NULL DEFAULT 1,
  max_nights       INTEGER,
  host_user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  host_name        TEXT,                                   -- відображуване ім'я господаря
  rating_avg       REAL NOT NULL DEFAULT 0,                -- кеш із reviews
  rating_count     INTEGER NOT NULL DEFAULT 0,
  source           TEXT NOT NULL DEFAULT 'native',         -- 'native' | інші джерела (для кросплатформності)
  is_published     INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0,1)),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  deleted_at       TEXT
);
CREATE INDEX idx_properties_region ON properties(region_id);
CREATE INDEX idx_properties_listed ON properties(is_published, deleted_at);

CREATE TABLE property_photos (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id      INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  r2_key           TEXT,                                   -- ключ у R2 (основний шлях)
  url              TEXT,                                   -- зовнішнє посилання (тимчасові заглушки)
  alt              TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_cover         INTEGER NOT NULL DEFAULT 0 CHECK (is_cover IN (0,1)),
  CHECK (r2_key IS NOT NULL OR url IS NOT NULL)
);
CREATE INDEX idx_photos_property ON property_photos(property_id, sort_order);

CREATE TABLE amenities (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  code             TEXT NOT NULL UNIQUE,
  name_uk          TEXT NOT NULL,
  icon             TEXT
);
CREATE TABLE property_amenities (
  property_id      INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  amenity_id       INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, amenity_id)
);

-- ===== Бронювання та доступність =====
CREATE TABLE bookings (
  id               TEXT PRIMARY KEY,                       -- UUID
  property_id      INTEGER NOT NULL REFERENCES properties(id),
  user_id          TEXT REFERENCES users(id) ON DELETE SET NULL,   -- NULL для імпортованих зовнішніх броней
  check_in         TEXT NOT NULL,
  check_out        TEXT NOT NULL,
  guests           INTEGER NOT NULL DEFAULT 1 CHECK (guests > 0),
  total_minor      INTEGER NOT NULL DEFAULT 0,
  currency         TEXT NOT NULL DEFAULT 'UAH',
  status           TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending','confirmed','cancelled','completed')),
  payment_status   TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','pending','paid','refunded')),  -- оплата — наступний етап
  source           TEXT NOT NULL DEFAULT 'direct',         -- 'direct' | 'booking_com'
  external_id      TEXT,                                   -- ідентифікатор у зовнішньому каналі
  guest_name       TEXT,
  guest_email      TEXT,
  guest_phone      TEXT,
  note             TEXT,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  cancelled_at     TEXT,
  CHECK (check_out > check_in)
);
CREATE INDEX idx_bookings_property ON bookings(property_id, check_in, check_out);
CREATE INDEX idx_bookings_user ON bookings(user_id, created_at);
CREATE UNIQUE INDEX idx_bookings_external ON bookings(source, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE availability_blocks (                          -- закриті дати: господар, обслуговування, імпорт iCal з booking.com
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id      INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  start_date       TEXT NOT NULL,
  end_date         TEXT NOT NULL,                          -- виключно
  reason           TEXT NOT NULL DEFAULT 'host',           -- 'host' | 'maintenance' | 'booking_com'
  source           TEXT NOT NULL DEFAULT 'manual',
  external_uid     TEXT,                                   -- UID події iCal
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK (end_date > start_date),
  UNIQUE (property_id, source, external_uid)
);
CREATE INDEX idx_blocks_property ON availability_blocks(property_id, start_date, end_date);

-- Захист від подвійних бронювань на рівні бази.
CREATE TRIGGER trg_bookings_no_overlap
BEFORE INSERT ON bookings
WHEN NEW.status IN ('pending','confirmed') AND (
  EXISTS (SELECT 1 FROM bookings b
          WHERE b.property_id = NEW.property_id AND b.status IN ('pending','confirmed')
            AND b.check_in < NEW.check_out AND b.check_out > NEW.check_in)
  OR EXISTS (SELECT 1 FROM availability_blocks k
          WHERE k.property_id = NEW.property_id
            AND k.start_date < NEW.check_out AND k.end_date > NEW.check_in)
)
BEGIN
  SELECT RAISE(ABORT, 'dates_unavailable');
END;

-- ===== Інтеграції, відгуки, обране, аудит =====
CREATE TABLE channel_links (                                -- зв'язок оселі з зовнішнім каналом (booking.com тощо)
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id      INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  channel          TEXT NOT NULL,                          -- 'booking_com'
  ical_import_url  TEXT,                                   -- календар з каналу -> блокуємо дати в нас
  ical_export_token TEXT,                                  -- секрет у нашому iCal-посиланні -> канал бачить наші броні
  enabled          INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0,1)),
  last_synced_at   TEXT,
  last_status      TEXT,
  UNIQUE (property_id, channel)
);

CREATE TABLE reviews (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id      INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id          TEXT REFERENCES users(id) ON DELETE SET NULL,
  booking_id       TEXT UNIQUE REFERENCES bookings(id) ON DELETE SET NULL,
  rating           INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body             TEXT,
  is_published     INTEGER NOT NULL DEFAULT 1 CHECK (is_published IN (0,1)),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_reviews_property ON reviews(property_id, created_at);

CREATE TABLE favorites (
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id      INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (user_id, property_id)
);

CREATE TABLE audit_log (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_user_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
  action           TEXT NOT NULL,
  entity           TEXT,
  entity_id        TEXT,
  meta             TEXT,                                   -- JSON
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_audit_created ON audit_log(created_at);
